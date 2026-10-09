// Runtime settings for the Netlify function. Imported before app.js so they're
// in place when the routes load.
process.env.NODE_ENV ||= "production";
// Function disks don't persist, so uploaded images go to Netlify Blobs.
process.env.UPLOAD_STORAGE = "blobs";
