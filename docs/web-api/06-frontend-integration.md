# Frontend Integration

Generate the frozen integration source with `python scripts/export_openapi.py`. A frontend first calls `/api/v1/status`, retains the selected browser `File`, posts it to dataset inspection, selects a returned machine ID, and resends the same file for machine summary, series, and prediction. The API is stateless: there is nothing to register or delete. Clients clear all API-derived state and abort obsolete multipart requests when the file, machine, API version, or real/demo mode changes.
