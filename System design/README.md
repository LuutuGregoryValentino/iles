# System Design — ILES

This folder contains all system design diagrams for the ILES project.

## Files
- `ERD_OF_THE_ILES.jpg` — Entity Relationship Diagram showing all 9 models and their relationships
- `DFD_OF_ILES.png` — Data Flow Diagram showing how data moves between React, Django API and the database
- `DFD_OF_ILES.svg` — SVG version of the DFD

## Key design decisions
- Custom User model with role field (student, academic_supervisor, workplace_supervisor, administrator)
- JWT authentication — access token (8hr) + refresh token (7 days)
- Decoupled architecture — React on port 3000, Django on port 8000
- Overlap prevention on placements enforced at model level
- Weighted scoring: 40% workplace + 30% academic + 30% logbook
- Logbook locked after Approved status — cannot be edited
