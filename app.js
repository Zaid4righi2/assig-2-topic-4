// تحميل المتغيرات البيئية من ملف .env
require("dotenv").config();


const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const path = require("path");
const users = require("./data/users"); 

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 
app.use(express.static(path.join(__dirname, "public"))); // تقديم الملفات الثابتة 
app.use(session({
    secret: "super-secret", 
    resave: false,
    saveUninitialized: true,
}));


app.set("view engine", "ejs");

// وسيط مخصص: لمنع الوصول لمسارات معينة
app.use((req, res, next) => {
    const restrictedPaths = ["/admin", "/admin/delete"];
    const originalHeader = req.get("X-Original-URL");

    if (restrictedPaths.includes(req.path)) {
        return res.status(403).render("blocked"); 

    if (originalHeader) {
        req.url = originalHeader;
    }

    next();
});


app.get("/", (req, res) => {
    res.render("index", { user: req.session.username });
});


app.route("/login")
    .get((req, res) => {
        res.render("login", { error: null });
    })
    .post((req, res) => {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            req.session.username = user.username;
            req.session.role = user.role;
            return res.redirect("/myaccount"); // تحويل للمستخدم إلى حسابه
        }

        res.render("login", { error: "بيانات الدخول غير صحيحة" });
    });


app.route("/register")
    .get((req, res) => {
        res.render("register", { error: null });
    })
    .post((req, res) => {
        const { username, password, role } = req.body;
        const existingUser = users.find(u => u.username === username);

        if (existingUser) {
            return res.render("register", { error: "المستخدم موجود بالفعل" });
        }

        const validRoles = ["admin", "user"];
        const userRole = validRoles.includes(role) ? role : "user";

        users.push({ username, password, role: userRole });
        res.redirect("/login");
    });


app.get("/myaccount", (req, res) => {
    if (!req.session.username) {
        return res.redirect("/login"); // إعادة التوجيه إلى تسجيل الدخول إذا لم يتم تسجيل الدخول
    }

    res.render("myaccount", {
        username: req.session.username,
        role: req.session.role,
    });
});


app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});


app.get("/admin", (req, res) => {
    if (req.session.role === "admin") {
        return res.render("admin");
    }
    res.status(403).render("blocked"); // إذا لم يكن أدمن يتم حظره
});


app.get("/admin/delete", (req, res) => {
    const username = req.query.username;

    if (req.session.role === "admin" && username === "zaid") {
        return res.render("delete", { deleted: true, user: username });
    }

    res.render("delete", { deleted: true, deletedUser: username });
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على الرابط: http://localhost:${PORT}`);
});
