#!/usr/bin/env python3
"""Audit the public Divar real-estate dataset and export a small weak-label sample.

Uses only the Python standard library. The raw CSV and generated outputs stay local;
do not commit the dataset or generated records to this repository.
"""
from __future__ import annotations

import argparse
import csv
import json
import random
import sys
import urllib.request
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw" / "real_estate_ads.csv"
OUTPUT_DIR = ROOT / "data" / "processed"
DATASET_URL = (
    "https://huggingface.co/datasets/divarofficial/real_estate_ads/"
    "resolve/030e4fc89f1e964f23b2136aae625af3a8e155e6/real_estate_ads.csv"
)
KEY_COLUMNS = (
    "cat2_slug",
    "cat3_slug",
    "city_slug",
    "neighborhood_slug",
    "title",
    "description",
    "land_size",
    "building_size",
    "price_value",
    "rent_value",
    "credit_value",
    "deed_type",
    "rooms_count",
)
INTENT_BY_CATEGORY = {
    "residential-sell": "sell",
    "commercial-sell": "sell",
    "residential-rent": "rent",
    "commercial-rent": "rent",
    "temporary-rent": "rent",
}
RANDOM_SEED = 296


def download_dataset(destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and destination.stat().st_size > 0:
        print(f"Using existing CSV: {destination} ({destination.stat().st_size:,} bytes)")
        return

    print(f"Downloading official dataset to {destination}")
    print("The CSV is about 781 MB; this can take a while.")
    request = urllib.request.Request(
        DATASET_URL,
        headers={"User-Agent": "estateAssistant-dataset-audit/1.0"},
    )
    temporary = destination.with_suffix(destination.suffix + ".part")
    try:
        with urllib.request.urlopen(request, timeout=60) as response, temporary.open("wb") as out:
            total = int(response.headers.get("Content-Length", "0") or 0)
            downloaded = 0
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
                downloaded += len(chunk)
                if total and downloaded % (25 * 1024 * 1024) < 1024 * 1024:
                    print(f"  {downloaded / total:.0%} ({downloaded:,}/{total:,} bytes)")
        temporary.replace(destination)
    except Exception:
        temporary.unlink(missing_ok=True)
        raise


def is_present(value: Any) -> bool:
    return value is not None and str(value).strip() not in {"", "null", "None", "nan"}


def row_text(row: dict[str, str]) -> str:
    title = (row.get("title") or "").strip()
    description = (row.get("description") or "").strip()
    return "\n".join(part for part in (title, description) if part)


def make_weak_example(row: dict[str, str]) -> dict[str, Any] | None:
    text = row_text(row)
    if not text:
        return None

    category = (row.get("cat2_slug") or "").strip()
    property_type = (row.get("cat3_slug") or "").strip()
    # Keep category-derived labels explicitly marked as weak labels. They are not
    # equivalent to a user's conversational intent and must be manually validated.
    labels: dict[str, Any] = {
        "intent": INTENT_BY_CATEGORY.get(category),
        "propertyTypeSource": property_type or None,
        "landAreaSqm": row.get("land_size") or None,
        "buildingAreaSqm": row.get("building_size") or None,
        "citySlug": row.get("city_slug") or None,
        "neighborhoodSlug": row.get("neighborhood_slug") or None,
        "deedTypeSource": row.get("deed_type") or None,
        "priceValueSource": row.get("price_value") or None,
        "rentValueSource": row.get("rent_value") or None,
        "creditValueSource": row.get("credit_value") or None,
        "roomsCountSource": row.get("rooms_count") or None,
    }
    return {
        "source": "divarofficial/real_estate_ads",
        "sourceStyle": "listing_title_and_description",
        "weakLabel": True,
        "text": text,
        "labels": labels,
    }


def audit(csv_path: Path, sample_limit: int) -> dict[str, Any]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    missing = Counter()
    categories = Counter()
    property_types = Counter()
    cities = Counter()
    rows_seen = 0
    rows_with_text = 0
    candidate_count = 0
    reservoir: list[dict[str, Any]] = []
    rng = random.Random(RANDOM_SEED)

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        available = set(reader.fieldnames or [])
        required = {"cat2_slug", "cat3_slug", "city_slug", "title", "description"}
        absent = sorted(required - available)
        if absent:
            raise ValueError(f"Unexpected dataset schema; missing columns: {absent}")

        for source_row, row in enumerate(reader, start=2):
            rows_seen += 1
            for column in KEY_COLUMNS:
                if column in available and not is_present(row.get(column)):
                    missing[column] += 1

            category = (row.get("cat2_slug") or "").strip() or "(missing)"
            property_type = (row.get("cat3_slug") or "").strip() or "(missing)"
            city = (row.get("city_slug") or "").strip() or "(missing)"
            categories[category] += 1
            property_types[property_type] += 1
            cities[city] += 1

            if not row_text(row):
                continue
            rows_with_text += 1
            example = make_weak_example(row)
            if example is None:
                continue

            # Physical CSV row number (header is row 1); not a listing ID.
            example["sourceRow"] = source_row

            # Focus the sample on listings most relevant to our property parser:
            # villa/land records plus rows where land/building size or deed is known.
            relevant = (
                "villa" in property_type.lower()
                or "land" in property_type.lower()
                or "apartment" in property_type.lower()
                or "house" in property_type.lower()
                or is_present(row.get("land_size"))
                or is_present(row.get("building_size"))
                or is_present(row.get("deed_type"))
                or is_present(row.get("rooms_count"))
            )
            if not relevant:
                continue

            candidate_count += 1
            if len(reservoir) < sample_limit:
                reservoir.append(example)
            else:
                index = rng.randrange(candidate_count)
                if index < sample_limit:
                    reservoir[index] = example

            if rows_seen % 100_000 == 0:
                print(f"Scanned {rows_seen:,} rows; text rows: {rows_with_text:,}")

    total = rows_seen or 1
    report = {
        "dataset": "divarofficial/real_estate_ads",
        "sourceUrl": "https://huggingface.co/datasets/divarofficial/real_estate_ads",
        "license": "ODbL",
        "rawCsv": str(csv_path.relative_to(ROOT)) if csv_path.is_relative_to(ROOT) else str(csv_path),
        "rows": rows_seen,
        "rowsWithTitleOrDescription": rows_with_text,
        "rowsWithTextPercent": round(rows_with_text * 100 / total, 2),
        "weakLabelCandidateRows": candidate_count,
        "exportedWeakLabelSampleRows": len(reservoir),
        "columnsFound": sorted(available),
        "missingCount": {key: missing[key] for key in KEY_COLUMNS if key in available},
        "missingPercent": {
            key: round(missing[key] * 100 / total, 2)
            for key in KEY_COLUMNS
            if key in available
        },
        "topListingCategories": categories.most_common(20),
        "topPropertyTypes": property_types.most_common(20),
        "topCities": cities.most_common(30),
        "limitations": [
            "The source contains real-estate listing text, not agent-to-assistant chat messages.",
            "Intent labels are weak labels derived from listing categories; manually validate before training.",
            "Missing values are unknown, not evidence that a property lacks that feature.",
            "Do not infer building area from land area or vice versa.",
        ],
    }

    report_path = OUTPUT_DIR / "divar_dataset_audit.json"
    examples_path = OUTPUT_DIR / "divar_weak_label_sample.jsonl"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    with examples_path.open("w", encoding="utf-8", newline="\n") as handle:
        for example in reservoir:
            handle.write(json.dumps(example, ensure_ascii=False) + "\n")

    print(f"\nAudit report: {report_path}")
    print(f"Weak-label sample: {examples_path}")
    print(f"Rows scanned: {rows_seen:,}")
    print(f"Rows with text: {rows_with_text:,}")
    print(f"Relevant candidates: {candidate_count:,}")
    print(f"Sample exported: {len(reservoir):,}")
    print("\nTop listing categories:")
    for name, count in categories.most_common(10):
        print(f"  {name}: {count:,}")
    print("\nTop property types:")
    for name, count in property_types.most_common(10):
        print(f"  {name}: {count:,}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, default=RAW_PATH, help="Path to an already downloaded CSV")
    parser.add_argument("--download", action="store_true", help="Download the pinned public CSV if missing")
    parser.add_argument("--sample-limit", type=int, default=10_000, help="Number of relevant rows to reservoir-sample")
    args = parser.parse_args()

    if args.sample_limit < 1:
        parser.error("--sample-limit must be >= 1")

    if args.download:
        download_dataset(args.csv)
    if not args.csv.exists():
        print(
            f"CSV not found: {args.csv}\n"
            "Run with --download to download the public dataset, or pass --csv PATH.",
            file=sys.stderr,
        )
        return 2

    audit(args.csv.resolve(), args.sample_limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
