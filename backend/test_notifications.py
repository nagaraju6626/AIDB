import requests

token = None

# Login to get token
res = requests.post('http://127.0.0.1:8000/api/auth/login', data={'username': 'test@example.com', 'password': 'NewPassword123!'})
token = res.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

# Get notifications
res = requests.get('http://127.0.0.1:8000/api/notifications', headers=headers)
notifs = res.json()
print('Notifications:', len(notifs))
if len(notifs) > 0:
    print('First notif:', notifs[0])

# Unread count
res = requests.get('http://127.0.0.1:8000/api/notifications/unread-count', headers=headers)
print('Unread:', res.json())

# Mark read
if len(notifs) > 0:
    res = requests.patch(f"http://127.0.0.1:8000/api/notifications/{notifs[0]['id']}/read", headers=headers)
    print('Mark read:', res.json()['is_read'])
    
    # Read all
    res = requests.patch('http://127.0.0.1:8000/api/notifications/read-all', headers=headers)
    print('Mark all read:', res.json())
    
    # Delete
    res = requests.delete(f"http://127.0.0.1:8000/api/notifications/{notifs[0]['id']}", headers=headers)
    print('Delete:', res.json())
