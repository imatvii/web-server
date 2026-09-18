import express from 'express';
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello, web!');
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
app.get('/projects', (req, res) => {
  const projects = [
    { name: 'Weather app', tag: 'javascript' },
    { name: 'Portfolio site', tag: 'express' },
    { name: 'Budget tracker', tag: 'python' },
  ];
  const tag = req.query.tag ?? null;
  if (!tag) {
    const resu = projects.map(p => p.name).join(' ');
    return res.send(resu);
  }
  const filtered = projects.filter(p => p.tag === tag);
  const resu = filtered.map(p => p.name).join(' ');
  res.send(resu);
});
app.set("view engine", "ejs");
app.get("/about", (req, res) => {
  res.render("about", { title: "About" });
});