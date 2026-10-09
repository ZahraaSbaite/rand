import app from "./app.js";

// Local development server. In production the same app runs as a Netlify
// function (see netlify.js).
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
