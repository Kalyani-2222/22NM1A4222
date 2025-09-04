import React, { useState } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  Navigate,
} from "react-router-dom";

//
// ---------------- UTILS ----------------
//

// Logging middleware
const logEvent = (type, message, data = {}) => {
  const log = {
    timestamp: new Date().toISOString(),
    type,
    message,
    ...data,
  };
  let logs = JSON.parse(localStorage.getItem("logs")) || [];
  logs.push(log);
  localStorage.setItem("logs", JSON.stringify(logs));
};

// Validation helpers
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidInteger = (val) => {
  return Number.isInteger(Number(val)) && Number(val) > 0;
};

//
// ---------------- COMPONENTS ----------------
//

// URL Shortener Form
function UrlForm({ onShorten }) {
  const [urls, setUrls] = useState([
    { longUrl: "", validity: "", shortcode: "" },
  ]);

  const handleChange = (index, field, value) => {
    const newUrls = [...urls];
    newUrls[index][field] = value;
    setUrls(newUrls);
  };

  const handleAddField = () => {
    if (urls.length < 5) {
      setUrls([...urls, { longUrl: "", validity: "", shortcode: "" }]);
    }
  };

  const handleSubmit = () => {
    const validInputs = urls.every((u) => isValidUrl(u.longUrl));
    if (!validInputs) {
      logEvent("error", "Invalid URL entered");
      alert("Please enter valid URLs");
      return;
    }

    const processed = urls.map((u) => ({
      ...u,
      validity:
        u.validity && isValidInteger(u.validity)
          ? Number(u.validity)
          : 30, // default 30 mins
      shortcode: u.shortcode || Math.random().toString(36).substring(2, 7),
      createdAt: new Date(),
      clicks: [],
    }));

    logEvent("info", "URLs shortened", { count: processed.length });
    onShorten(processed);
  };

  return (
    <Box>
      {urls.map((u, i) => (
        <Box key={i} sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Original URL"
            fullWidth
            value={u.longUrl}
            onChange={(e) => handleChange(i, "longUrl", e.target.value)}
          />
          <TextField
            label="Validity (minutes)"
            type="number"
            value={u.validity}
            onChange={(e) => handleChange(i, "validity", e.target.value)}
          />
          <TextField
            label="Preferred Shortcode"
            value={u.shortcode}
            onChange={(e) => handleChange(i, "shortcode", e.target.value)}
          />
        </Box>
      ))}
      <Button onClick={handleAddField}>+ Add More</Button>
      <Button variant="contained" onClick={handleSubmit}>
        Shorten
      </Button>
    </Box>
  );
}

// Display shortened URLs
function UrlList({ data }) {
  return (
    <div>
      {data.map((u, i) => (
        <Card key={i} sx={{ my: 2 }}>
          <CardContent>
            <Typography>
              <b>Original:</b> {u.longUrl}
            </Typography>
            <Typography>
              <b>Short:</b> http://localhost:3000/{u.shortcode}
            </Typography>
            <Typography>
              <b>Expires in:</b> {u.validity} min
            </Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Analytics component
function Analytics({ data }) {
  return (
    <div>
      {data.map((u, i) => (
        <Card key={i} sx={{ my: 2 }}>
          <CardContent>
            <Typography>
              <b>Short URL:</b> {u.shortcode}
            </Typography>
            <Typography>
              <b>Clicks:</b> {u.clicks.length}
            </Typography>
            {u.clicks.map((c, j) => (
              <Typography key={j}>
                {c.timestamp} | {c.source} | {c.location}
              </Typography>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Redirect handler
function RedirectPage({ data }) {
  const { code } = useParams();
  const link = data.find((u) => u.shortcode === code);

  if (!link) return <h2>404 - Not Found</h2>;

  // Track click
  link.clicks.push({
    timestamp: new Date().toISOString(),
    source: document.referrer || "Direct",
    location: "Unknown", // Can integrate IP API later
  });

  return <Navigate to={link.longUrl} replace />;
}

//
// ---------------- MAIN APP ----------------
//
function App() {
  const [data, setData] = useState([]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1>URL Shortener</h1>
              <UrlForm onShorten={(urls) => setData([...data, ...urls])} />
              <UrlList data={data} />
              <h2>Analytics</h2>
              <Analytics data={data} />
            </>
          }
        />
        <Route path="/:code" element={<RedirectPage data={data} />} />
      </Routes>
    </Router>
  );
}

export default App;

