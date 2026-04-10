from django.shortcuts import render

def login_view(request):
    return render(request, 'login.html')

def dashboard_view(request):
    return render(request, 'dashboard.html')

def report_view(request):
    if request.method == 'POST':
        date = request.POST.get('date')
        description = request.POST.get('description')
        hours = request.POST.get('hours')
        challenges = request.POST.get('challenges')
        attachment = request.FILES.get('attachment')


        print(date, description, hours, challenges, attachment)  # temporary (we’ll save later)

    return render(request, 'report.html')