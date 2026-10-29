# Divar dataset audit for estateAssistant

## Why this dataset

The public Hugging Face dataset `divarofficial/real_estate_ads` contains approximately one million Persian real-estate listings. The published schema includes:

- `title`, `description`: authentic listing language
- `cat2_slug`, `cat3_slug`: listing and property categories
- `city_slug`, `neighborhood_slug`: location labels
- `land_size`, `building_size`: separate land and building area fields
- `price_value`, `rent_value`, `credit_value`: listing price fields
- `deed_type`, `rooms_count`: additional structured attributes

Source: https://huggingface.co/datasets/divarofficial/real_estate_ads  
Published license: ODbL. Review the dataset card/license and comply with attribution/share-alike requirements before distributing a derived database or product. Do not commit the raw CSV or generated dataset files to this repository.

## Important limitation

These are listing advertisements, not conversational messages sent by an agent to an AI assistant. They are useful for learning the vocabulary and phrasing used in real listings and for studying structured fields, but they do not directly teach the system all the different ways a person can say "I have a villa to sell."

The script exports **weak labels**, derived from listing categories and structured columns. Treat these as candidates for exploration and augmentation, not as verified training labels. In particular:

- A listing category is not always the same as a user's intent in a conversation.
- Empty fields mean unknown/missing, not that the property lacks the feature.
- `land_size` and `building_size` must remain separate.
- Do not train directly on the entire sample without checking category balance, duplicates, outliers, and label quality.
- Keep a separate hand-checked conversational benchmark for buy/sell/rent/lease-out/exchange, ambiguous intent, and multi-turn clarification.

## Run the audit on Windows

From the repository root in PowerShell:

```powershell
python scripts/audit-divar-dataset.py --download
```

The CSV is roughly 781 MB. The script downloads it only if the file does not already exist, then streams through it with Python's standard library. No pandas or Hugging Face package is required.

To audit a CSV that you downloaded manually:

```powershell
python scripts/audit-divar-dataset.py --csv "E:\\datasets\\real_estate_ads.csv"
```

To export a smaller exploratory sample:

```powershell
python scripts/audit-divar-dataset.py --sample-limit 2000
```

## Local outputs

The script creates these files under `data/processed/`:

- `divar_dataset_audit.json`: row count, available columns, missing-value percentages, and top categories/types/cities.
- `divar_weak_label_sample.jsonl`: a deterministic reservoir sample of up to 10,000 relevant listings (or the requested limit), with source text and weak labels.

These outputs are local and are ignored by Git. Use the report to decide whether to build a reviewed subset for extraction tests. The next modeling step should be to turn a small selection of listings into **separate conversational examples** with reviewed expected JSON, rather than treating listing text as if it were already conversational input.
