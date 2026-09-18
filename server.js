import express from 'express';
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello, web!');
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
app.set("view engine", "ejs");
app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});