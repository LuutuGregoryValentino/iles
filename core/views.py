from django.shortcuts import render

def login_view(request):
    return render(request, 'login.html')

def dashboard_view(request):
    return render(request, 'dashboard.html')

def report_view(request):
    if request.method == 'POST':
        date = request.POST.get('date')
        activities = request.POST.get('activities')
        challenges = request.POST.get('challenges')

        print(date, activities, challenges)  # temporary (we’ll save later)

    return render(request, 'report.html')