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

אין משתני סביבה נדרשים. אין API keys ואין סיסמאות בקוד.

הקובץ `.env.example` קיים לתיעוד בלבד. אין צורך ליצור `.env` כדי שהאפליקציה תעבוד, ואין צורך להגדיר Environment Variables ב-Vercel.

## 5. Database

אין מסד נתונים בשרת.

Holikar שומרת הכל ב-IndexedDB בתוך הדפדפן של המשתמש (דרך Dexie):

- בדיקות
- תבניות
- סטטוסים
- הגדרות (שם מבצע, מלון, מחלקה, חדרים)

משמעות לפרסום:

- כל מכשיר / דפדפן מחזיק ארכיון משלו
- ניקוי נתוני האתר בדפדפן מוחק את הארכיון המקומי
- אפשר לגבות ולשחזר מתוך מסך **הגדרות** (קובץ JSON)
- Vercel מארח רק את קבצי ה-frontend הסטטיים

## 6. מה להגדיר ב-Vercel

אחרי שהפרויקט ב-GitHub (העלאה ידנית שלך דרך VS Code):

1. ב-Vercel: **Add New… → Project**.
2. בוחרים את ה-Repository של Holikar.
3. Framework Preset: **Vite** (אוטומטי; מוגדר גם ב-`vercel.json`).
4. Root Directory: השארת ברירת המחדל (שורש הריפו).
5. אין צורך ב-Environment Variables.
6. Deploy.

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
