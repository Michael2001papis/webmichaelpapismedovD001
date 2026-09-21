# Holikar

אפליקציית Web לניהול בדיקות, ליקויים ומשימות בחדרי מלון.  
מיועדת לשימוש פנימי באחזקה, מלון יאכט הרצליה.

המערכת בנויה ב-React + TypeScript + Vite. הנתונים נשמרים בדפדפן של המשתמש (IndexedDB), בלי שרת ובלי מסד נתונים חיצוני.

מדריך שימוש מפורט בעברית נמצא בקובץ `Holikar-מדריך-שימוש.txt`.

## 1. התקנה

דרישות: Node.js 20 ומעלה, ו-npm.

בתיקיית הפרויקט:

```bash
npm install
```

אין צורך בקבצים מחוץ לתיקייה הזו. אחרי `npm install` נוצרת `node_modules` מקומית במחשב שמריץ את הפקודה.

## 2. הרצה מקומית

```bash
npm run dev
```

האתר נפתח ב-[http://localhost:5173](http://localhost:5173).  
באותה רשת Wi-Fi אפשר לפתוח גם מהטלפון לפי כתובת Network שמופיעה בטרמינל.

## 3. בניית Production

```bash
npm run build
```

הפלט נוצר בתיקייה `dist`. לבדיקה מקומית של ה-build:

```bash
npm run preview
```

## 4. Environment Variables

בדיקות המלון עצמן לא דורשות משתני סביבה.

מנגנון Admin (פתיחה/סגירה של Holikar) כן דורש משתנים בשרת. הסיסמה לא נשמרת בקוד ולא ב-Frontend.

העתיקו `.env.example` ל-`.env` מקומי (הקובץ `.env` לא עולה ל-GitHub):

```text
HOLIKAR_ADMIN_USER=
HOLIKAR_ADMIN_PASSWORD_HASH=
HOLIKAR_SESSION_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

יצירת Hash לסיסמה (בלי לכתוב את הסיסמה בקוד):

```bash
npm run admin:hash -- "your-strong-password"
```

הדביקו את הפלט ב-`HOLIKAR_ADMIN_PASSWORD_HASH`.  
`HOLIKAR_SESSION_SECRET` צריך מחרוזת ארוכה ואקראית (למשל 32 תווים).

ב-Vercel: Settings → Environment Variables — אותם שמות, בלי לשים סיסמה גלויה.

עבור מצב סגור/פתוח **גלובלי בין מכשירים** ב-Vercel חובה Redis (Upstash חינמי או Vercel KV). בלי זה המצב עלול להישמר רק בזיכרון של שרת בודד.

## 5. Database

בדיקות, תבניות, סטטוסים והגדרות נשמרים ב-IndexedDB בדפדפן של המשתמש (Dexie). זה ארכיון מקומי לכל מכשיר.

מצב הפעלה/כיבוי של Holikar (Admin Lock) נשמר ב-Backend:

- מקומית: קובץ `data/system-lock.json` (לא עולה ל-GitHub)
- ב-Vercel: Redis לפי משתני הסביבה למעלה

אין צורך במסד נתונים נפרד לבדיקות החדרים.

## 6. מה להגדיר ב-Vercel

אחרי שהפרויקט ב-GitHub (העלאה ידנית שלך דרך VS Code):

1. ב-Vercel: **Add New… → Project**.
2. בוחרים את ה-Repository של Holikar.
3. Framework Preset: **Vite** (אוטומטי; מוגדר גם ב-`vercel.json`).
4. מגדירים Environment Variables של Admin (ראה סעיף 4). בלי הסיסמה עצמה.
5. Deploy.

הקובץ `vercel.json` כבר מגדיר:

- Build Command
- Output Directory
- SPA rewrites, כדי שנתיבים כמו `/archive` ו-`/inspection/:id` יעבדו גם אחרי רענון הדף ולא יחזירו 404

Node.js: הקובץ `.nvmrc` קובע גרסה 20. Vercel קורא אותו אוטומטית.

## 7. Build Command

```text
npm run build
```

## 8. Output Directory

```text
dist
```

Install Command (ברירת המחדל של Vercel מספיקה):

```text
npm install
```

## 9. אחרי העלאה ל-GitHub

לא צריך פעולות נוספות בקוד, ולא צריך לחבר שירותים מעבר ל-Vercel.

### מה להעלות ומה לא

השתמש ב-Git מתוך VS Code (לא בהעלאת תיקייה ידנית לדפדפן). הקובץ `.gitignore` כבר מונע קבצים מיותרים.

**כן להעלות:**

- `src/`, `public/`, `index.html`
- `package.json`, `package-lock.json`
- `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `vercel.json`, `.gitignore`, `.gitattributes`, `.nvmrc`, `.oxlintrc.json`
- `.env.example`
- `README.md`, `Holikar-מדריך-שימוש.txt`

**לא להעלות:**

- `node_modules`
- `dist`
- `.env` (אם ייווצר בעתיד)
- `.vercel`, `.cursor`, קבצי עורך זמניים

אחרי Deploy ב-Vercel כדאי לבדוק:

- עמוד הבית
- יצירת בדיקה
- `/archive`, `/templates`, `/settings`
- רענון דף בתוך בדיקה (`/inspection/...`) — צריך להישאר באותו מסך ולא 404
- ייצוא Excel ו-PDF

אחרי שהאתר החי עולה, משתמשים בכתובת של Vercel (לא ב-`localhost`) גם מהמחשב וגם מהטלפון.

## רישיון שימוש

שימוש פנימי. © Michael Papismedov
