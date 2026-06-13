# Email notifications are now handled directly in views.py
# to ensure they only fire during API interactions and avoid 
# duplicate emails from multiple save() calls.