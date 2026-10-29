#!/usr/bin/env python3
"""Import the full Divar CSV into a local SQLite search database.

The source CSV and generated database are intentionally kept out of Git.
Money values are preserved in source units (the dataset is commonly interpreted
as Toman); the API layer converts Rial budgets to Toman before comparing.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = ROOT / "data" / "raw" / "real_estate_ads.csv"
DEFAULT_DB = ROOT / "data" / "processed" / "divar_ads.sqlite"

TEXT_COLUMNS = [
    "cat2_slug", "cat3_slug", "city_slug", "neighborhood_slug",
    "created_at_month", "user_type", "title", "description", "rent_mode",
    "rent_type", "price_mode", "credit_mode", "deed_type", "rooms_count",
    "has_warm_water_provider", "has_heating_system", "has_cooling_system",
    "has_restroom", "building_direction", "floor_material", "property_type",
    "extra_person_capacity", "floor", "total_floors_count", "construction_year",
]
NUMBER_COLUMNS = [
    "rent_value", "price_value", "credit_value", "land_size", "building_size",
    "transformable_credit", "transformable_rent", "transformed_credit",
    "transformed_rent", "cost_per_extra_person", "rent_price_on_regular_days",
    "rent_price_on_special_days", "rent_price_at_weekends", "regular_person_capacity",
    "location_latitude", "location_longitude", "location_radius", "unit_per_floor",
]
BOOL_COLUMNS = [
    "rent_credit_transform", "transformable_price", "has_business_deed",
    "has_balcony", "has_elevator", "has_warehouse", "has_parking", "is_rebuilt",
    "has_water", "has_electricity", "has_gas", "has_security_guard",
    "has_barbecue", "has_pool", "has_jacuzzi", "has_sauna",
]
COLUMNS = TEXT_COLUMNS + NUMBER_COLUMNS + BOOL_COLUMNS


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value if value and value.lower() not in {"null", "none", "nan"} else None


def parse_number(value: Any) -> float | None:
    value = clean_text(value)
    if value is None:
        return None
    value = value.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
    value = value.replace(",", "").replace("،", "").replace("٬", "").replace(" ", "")
    try:
        result = float(value)
    except ValueError:
        return None
    return result if math.isfinite(result) else None


def parse_bool(value: Any) -> int | None:
    value = clean_text(value)
    if value is None:
        return None
    normalized = value.lower()
    if normalized in {"true", "1", "yes", "y", "بله", "دارد"}:
        return 1
    if normalized in {"false", "0", "no", "n", "خیر", "ندارد"}:
        return 0
    return None


def column_type(column: str) -> str:
    if column in NUMBER_COLUMNS:
        return "REAL"
    if column in BOOL_COLUMNS:
        return "INTEGER"
    return "TEXT"


def import_csv(csv_path: Path, database_path: Path, replace: bool) -> int:
    if not csv_path.is_file():
        raise FileNotFoundError(
            f"CSV not found: {csv_path}\n"
            "Place real_estate_ads.csv in data/raw/ or pass --csv."
        )
    if database_path.exists() and not replace:
        raise FileExistsError(
            f"Database already exists: {database_path}\n"
            "Use --replace to rebuild it from the CSV."
        )

    database_path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = database_path.with_suffix(database_path.suffix + ".building")
    temporary_path.unlink(missing_ok=True)
    temporary_path.parent.mkdir(parents=True, exist_ok=True)

    imported = 0
    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
            reader = csv.DictReader(source)
            available = set(reader.fieldnames or [])
            required = {"cat2_slug", "cat3_slug", "city_slug", "title", "description"}
            missing = sorted(required - available)
            if missing:
                raise ValueError(f"Unexpected CSV schema; missing columns: {missing}")

            # Keep a stable schema even if optional source columns are absent.
            columns_present = COLUMNS
            definitions = ["source_row INTEGER PRIMARY KEY"] + [
                f'"{column}" {column_type(column)}' for column in columns_present
            ]
            placeholders = ",".join("?" for _ in range(len(columns_present) + 1))
            quoted_columns = ",".join(["source_row"] + ['"' + column + '"' for column in columns_present])
            insert_sql = "INSERT INTO divar_ads (" + quoted_columns + ") VALUES (" + placeholders + ")"


            with sqlite3.connect(temporary_path) as db:
                db.execute("PRAGMA journal_mode=OFF")
                db.execute("PRAGMA synchronous=OFF")
                db.execute("PRAGMA temp_store=MEMORY")
                db.execute(f"CREATE TABLE divar_ads ({','.join(definitions)})")
                batch = []
                for source_row, row in enumerate(reader, start=2):
                    title = clean_text(row.get("title"))
                    description = clean_text(row.get("description"))
                    if title is None and description is None:
                        continue
                    values: list[Any] = [source_row]
                    for column in columns_present:
                        raw = row.get(column)
                        if column in NUMBER_COLUMNS:
                            values.append(parse_number(raw))
                        elif column in BOOL_COLUMNS:
                            values.append(parse_bool(raw))
                        else:
                            values.append(clean_text(raw))
                    batch.append(tuple(values))
                    if len(batch) >= 5000:
                        db.executemany(insert_sql, batch)
                        imported += len(batch)
                        batch.clear()
                        if imported % 100000 == 0:
                            print(f"Imported {imported:,} rows...")
                if batch:
                    db.executemany(insert_sql, batch)
                    imported += len(batch)

                for column in ("city_slug", "cat2_slug", "property_type", "cat3_slug", "created_at_month"):
                    if column in columns_present:
                        db.execute(f'CREATE INDEX idx_divar_{column} ON divar_ads ("{column}")')
                db.execute("CREATE INDEX idx_divar_sale_price ON divar_ads(price_value)")
                db.execute("CREATE INDEX idx_divar_rent_price ON divar_ads(rent_value)")
                db.execute("CREATE INDEX idx_divar_areas ON divar_ads(land_size, building_size)")
                db.execute("CREATE INDEX idx_divar_rooms ON divar_ads(rooms_count)")
                db.execute("ANALYZE")
                db.commit()

        if database_path.exists():
            database_path.unlink()
        os.replace(temporary_path, database_path)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise

    print(f"\nImported rows: {imported:,}")
    print(f"SQLite database: {database_path}")
    print("Raw prices and rents are preserved in source units; the API assumes Toman.")
    print("This is a historical dataset, not a live feed of current Divar listings.")
    return imported


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--database", type=Path, default=DEFAULT_DB)
    parser.add_argument("--replace", action="store_true", help="Replace an existing database")
    args = parser.parse_args()
    try:
        import_csv(args.csv.resolve(), args.database.resolve(), args.replace)
    except (FileNotFoundError, FileExistsError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
