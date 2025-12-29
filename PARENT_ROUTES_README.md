Project Parent API Routes - Roman Urdu Guide

Yeh file bata rahi hai ke `src/app/api/parent` ke andar jo routes main ne banaye woh kya return karte hain aur kaise use karein.

Important: Saare endpoints authenticated hain. Request mein `Authorization: Bearer <token>` header send karna zaroori hai.

Root route
- `GET /api/parent`  
  - Parent ke children ka list return karega. Agar aapka parent account database mein children rakhta hai to woh wahan se aayenge, warna mock data milega.

Child specific routes (replace `:childId` with child id):
- `GET /api/parent/:childId`  - Child ki basic detail.
- `GET /api/parent/:childId/assignments` - Child ke assignments list.
- `GET /api/parent/:childId/events` - School events relevant to child.
- `GET /api/parent/:childId/quizzes` - Quizzes list.
- `GET /api/parent/:childId/notes` - Uploaded notes/materials.
- `GET /api/parent/:childId/messages` - Messages sent to parent/child.
- `GET /api/parent/:childId/notifications` - Notifications (e.g., exam schedule).
- `GET /api/parent/:childId/attendance` - Recent attendance records for child.
- `GET /api/parent/:childId/library` - Library loans / resources.
- `GET /api/parent/:childId/announcements` - School announcements.
- `GET /api/parent/:childId/syllabus` - Syllabus / topics for subjects.

Usage example (curl)

```
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/parent"

curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/parent/child-1/assignments"
```

Notes aur next steps:
- Yeh endpoints abhi mock data return karte hain (ya userDoc se available data). Agaraap chahain mein inko database se connect kar doon (create/update/delete endpoints) aur pagination, filtering waghaira add kar doon.
- Agar aap chahte hain ke `Class / Subject` ki jagah real class list use ho, mujhe bata dein; mein `src/app/api/classes` ya `src/app/api/subjects` ko call kar ke dropdown populate kar dunga.

Roman Urdu mein summary:
- Ap parent token bhejain.
- `/api/parent` se apke bachon ki list milegi.
- Har bachay ke liye alag endpoints hain: assignments, events, attendance, etc.
- Filhal data mock/derived hai; agar chaho to mein inhe real DB operations se jod dunga.
