#!/usr/bin/env python3
"""Create a non-destructive quality report for the local Divar weak-label sample.

This script does not correct labels. It counts review signals and exports examples
so that suspicious patterns can be investigated before training.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "processed" / "divar_weak_label_sample.jsonl"
DEFAULT_REPORT = ROOT / "data" / "processed" / "divar_quality_report.json"
DEFAULT_EXAMPLES = ROOT / "data" / "processed" / "divar_quality_flags.csv"

# Keep price-per-unit cues specific: "متریال" means materials, not price per metre.
PRICE_PER_UNIT_RE = re.compile(
    r"(?:قیمت\s*(?:هر\s*)?متر|هر\s*متر(?:\s*مربع)?\s*(?:قیمت|تومان|میلیون)|"
    r"متری\s*\d[\d۰-۹٠-٩,،.]*\s*(?:تومان|میلیون|میلیارد)|"
    r"\d[\d۰-۹٠-٩,،.]*\s*تومان\s*(?:به\s*)?ازای\s*هر\s*متر)",
    re.IGNORECASE,
)
RENT_CUE_RE = re.compile(r"اجاره|رهن|ودیعه|روزانه|شبانه|ماهانه")
SELL_CUE_RE = re.compile(r"فروش|فروشی|به\s*فروش|فروشنده")
LAND_CUE_RE = re.compile(r"زمین|قطعه|پلاک|باغ(?:\s*ویلا)?|قصب")
BUILDING_CUE_RE = re.compile(
    r"بنا|زیربنا|زیر\s*بنا|ساختمان|آپارتمان|اتاق|خواب|دوبلکس|طبقه|مغازه|واحد"
)


def present(value: Any) -> bool:
    return value is not None and str(value).strip().lower() not in {
        "", "null", "none", "nan"
    }


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(
            f"Input not found: {path}\n"
            "Run scripts/audit-divar-dataset.py first."
        )
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON on line {line_number}") from exc
            if isinstance(item, dict):
                records.append(item)
    return records


def inspect(item: dict[str, Any]) -> list[str]:
    labels = item.get("labels") or {}
    text = item.get("text") or ""
    flags: list[str] = []

    category = str(labels.get("propertyTypeSource") or "").lower()
    land = present(labels.get("landAreaSqm"))
    building = present(labels.get("buildingAreaSqm"))

    # These are schema/text mismatch candidates, not confirmed data errors.
    if "plot" in category and building and not land:
        flags.append("plot_category_building_area_only")
    if "plot" in category and building and BUILDING_CUE_RE.search(text):
        flags.append("plot_category_text_mentions_building")
    if "plot" in category and not land and not building:
        flags.append("plot_category_no_area")
    if land and building:
        flags.append("both_land_and_building_area_present_check_meaning")

    intent = labels.get("intent")
    has_rent = bool(RENT_CUE_RE.search(text))
    has_sell = bool(SELL_CUE_RE.search(text))
    if has_rent and has_sell:
        flags.append("text_contains_rent_and_sell_cues")
    elif intent == "sell" and has_rent:
        flags.append("sell_label_text_contains_rent_cue")
    elif intent == "rent" and has_sell:
        flags.append("rent_label_text_contains_sell_cue")

    if PRICE_PER_UNIT_RE.search(text):
        flags.append("explicit_price_per_unit_phrase")
    if present(labels.get("priceValueSource")) and (
        present(labels.get("rentValueSource")) or present(labels.get("creditValueSource"))
    ):
        flags.append("sale_price_and_rent_or_credit_both_present")

    if not flags:
        flags.append("no_rule_based_flag")

    return flags


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--examples", type=Path, default=DEFAULT_EXAMPLES)
    parser.add_argument("--max-examples-per-flag", type=int, default=5)
    args = parser.parse_args()

    if args.max_examples_per_flag < 1:
        parser.error("--max-examples-per-flag must be >= 1")

    records = load_jsonl(args.input)
    flag_counts: Counter[str] = Counter()
    flagged_records = 0
    examples_by_flag: dict[str, list[dict[str, Any]]] = {}
    export_rows: list[dict[str, Any]] = []

    for item in records:
        labels = item.get("labels") or {}
        flags = inspect(item)
        if flags != ["no_rule_based_flag"]:
            flagged_records += 1

        for flag in flags:
            flag_counts[flag] += 1
            bucket = examples_by_flag.setdefault(flag, [])
            if flag != "no_rule_based_flag" and len(bucket) < args.max_examples_per_flag:
                bucket.append({
                    "sourceRow": item.get("sourceRow"),
                    "intent": labels.get("intent"),
                    "propertyTypeSource": labels.get("propertyTypeSource"),
                    "landAreaSqm": labels.get("landAreaSqm"),
                    "buildingAreaSqm": labels.get("buildingAreaSqm"),
                    "priceValueSource": labels.get("priceValueSource"),
                    "rentValueSource": labels.get("rentValueSource"),
                    "textPreview": (item.get("text") or "")[:500],
                })

        if flags != ["no_rule_based_flag"]:
            export_rows.append({
                "sourceRow": item.get("sourceRow", ""),
                "intent": labels.get("intent") or "",
                "propertyTypeSource": labels.get("propertyTypeSource") or "",
                "landAreaSqm": labels.get("landAreaSqm") or "",
                "buildingAreaSqm": labels.get("buildingAreaSqm") or "",
                "priceValueSource": labels.get("priceValueSource") or "",
                "rentValueSource": labels.get("rentValueSource") or "",
                "creditValueSource": labels.get("creditValueSource") or "",
                "flags": "; ".join(flags),
                "text": item.get("text", ""),
            })

    report = {
        "input": str(args.input),
        "recordsScanned": len(records),
        "recordsWithAtLeastOneReviewFlag": flagged_records,
        "recordsWithoutRuleBasedFlags": len(records) - flagged_records,
        "flagCounts": dict(flag_counts.most_common()),
        "sampleExamplesByFlag": examples_by_flag,
        "importantNotes": [
            "Flags are heuristics for investigation, not confirmed errors.",
            "Text may mention multiple transaction types without the listing itself being ambiguous.",
            "Missing values mean unknown; they do not prove a feature is absent.",
            "The source consists of listing text, not user-assistant conversations.",
            "This report does not modify the source JSONL or any labels.",
        ],
    }

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    args.examples.parent.mkdir(parents=True, exist_ok=True)
    columns = [
        "sourceRow", "intent", "propertyTypeSource", "landAreaSqm",
        "buildingAreaSqm", "priceValueSource", "rentValueSource",
        "creditValueSource", "flags", "text",
    ]
    with args.examples.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        writer.writerows(export_rows)

    print(f"Records scanned: {len(records):,}")
    print(f"Records with review flags: {flagged_records:,}")
    print(f"Records without rule-based flags: {len(records) - flagged_records:,}")
    print("\nFlag counts:")
    for name, count in flag_counts.most_common():
        if name != "no_rule_based_flag":
            print(f"  {name}: {count:,}")
    print(f"\nJSON report: {args.report}")
    print(f"Flagged examples CSV: {args.examples}")
    print("Flags are investigation hints only; no labels were changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
