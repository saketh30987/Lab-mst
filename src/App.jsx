import { useState, useEffect } from "react";

const INITIAL_POSTS = [
  { id: 1, title: "Welcome to the Blog", content: "This is the first post. Admins can manage posts.", author: "system", date: "2026-09-01" },
  { id: 2, title: "React Basics", content: "State, props and hooks are the core of React.", author: "system", date: "2026-09-10" },
];

// Load posts from localStorage (falls back to sample posts)
const loadPosts = () => {
  try {
    const saved = localStorage.getItem("posts");
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  } catch {
    return INITIAL_POSTS;
  }
};

export default function App() {
  // ---------- Auth state ----------
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null); // { name, role } or null
  const [error, setError] = useState("");

  // ---------- Post state ----------
  const [posts, setPosts] = useState(loadPosts);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // Save posts whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("posts", JSON.stringify(posts));
    } catch {}
  }, [posts]);

  const isAdmin = user?.role === "Admin";

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2000);
  };

  // ---------- Auth handlers ----------
  const handleLogin = (role) => {
    if (username.trim() === "") {
      setError("Please enter a username.");
      return;
    }
    setUser({ name: username.trim(), role });
    setError("");
    setUsername("");
  };

  const handleLogout = () => {
    setUser(null);
    resetForm();
    setSearch("");
  };

  // ---------- Post handlers ----------
  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return; // safety: only admin can write
    if (title.trim() === "" || content.trim() === "") {
      flash("Title and content are required.");
      return;
    }

    if (editingId === null) {
      const newPost = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        author: user.name,
        date: new Date().toISOString().slice(0, 10),
      };
      setPosts([newPost, ...posts]);
      flash("Post created.");
    } else {
      setPosts(
        posts.map((p) =>
          p.id === editingId ? { ...p, title: title.trim(), content: content.trim() } : p
        )
      );
      flash("Post updated.");
    }
    resetForm();
  };

  const handleEdit = (post) => {
    if (!isAdmin) return;
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this post?")) return;
    setPosts(posts.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
    flash("Post deleted.");
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
  );

  // ================= LOGIN SCREEN =================
  if (!user) {
    return (
      <div className="container">
        <div className="card login-card">
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <div className="btn-row">
            <button className="btn admin" onClick={() => handleLogin("Admin")}>
              Login as Admin
            </button>
            <button className="btn viewer" onClick={() => handleLogin("Viewer")}>
              Login as Viewer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= DASHBOARD =================
  return (
    <div className="dashboard">
      <header className="topbar">
        <h2>
          Welcome, {user.name} <span className={`badge ${isAdmin ? "b-admin" : "b-viewer"}`}>{user.role}</span>
        </h2>
        <button className="btn logout" onClick={handleLogout}>Logout</button>
      </header>

      {message && <div className="toast">{message}</div>}

      {/* Admin: create / edit form */}
      {isAdmin ? (
        <form className="card post-form" onSubmit={handleSubmit}>
          <h3>{editingId === null ? "Create Post" : "Edit Post"}</h3>
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows="4"
            placeholder="Post content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="btn-row">
            <button type="submit" className="btn admin">
              {editingId === null ? "Add Post" : "Save Changes"}
            </button>
            {editingId !== null && (
              <button type="button" className="btn logout" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="readonly">Read-only access — you can view posts but not create, edit or delete them.</p>
      )}

      {/* Post list */}
      <div className="list-header">
        <h3>{isAdmin ? "Manage Posts" : "Posts"} ({filteredPosts.length})</h3>
        <input
          type="text"
          className="search"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredPosts.length === 0 && <p className="empty">No posts found.</p>}

      {filteredPosts.map((post) => (
        <article className="card post" key={post.id}>
          <h4>{post.title}</h4>
          <p>{post.content}</p>
          <small>By {post.author} • {post.date}</small>

          {isAdmin && (
            <div className="post-actions">
              <button className="btn edit" onClick={() => handleEdit(post)}>Edit</button>
              <button className="btn delete" onClick={() => handleDelete(post.id)}>Delete Post</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
