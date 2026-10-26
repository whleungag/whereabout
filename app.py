import sqlite3
import threading
import time
import tkinter as tk
from tkinter import messagebox, ttk

# Point this to your shared network folder path
# e.g., r"\\OfficeServer\SharedFolder\whereabouts_data.db"
DB_PATH = "whereabouts_shared.db"


def init_db():
  conn = sqlite3.connect(DB_PATH)
  conn.execute("PRAGMA journal_mode=WAL;")  # Safe for multi-user access
  cursor = conn.cursor()
  # Create members table
  cursor.execute(
      """CREATE TABLE IF NOT EXISTS members (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    title TEXT
                )"""
  )
  # Create events table
  cursor.execute(
      """CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    member_id INTEGER,
                    date TEXT,
                    event_name TEXT,
                    tag TEXT,
                    FOREIGN KEY(member_id) REFERENCES members(id)
                )"""
  )
  # Insert sample data if empty
  cursor.execute("SELECT COUNT(*) FROM members")
  if cursor.fetchone()[0] == 0:
    sample_members = [
        ("SE/TSG Kay", "Senior Engineer"),
        ("E/TSG/1 March", "Engineer"),
        ("E/TSG/2 Samantha", "Engineer"),
        ("E/TSG/3 Ken", "Engineer"),
    ]
    cursor.executemany(
        "INSERT INTO members (name, title) VALUES (?, ?)", sample_members
    )
  conn.commit()
  conn.close()


class WhereAboutsApp:

  def __init__(self, root):
    self.root = root
    self.root.title("WhereAbouts (Shared Network Version)")
    self.root.geometry("1100x700")

    init_db()
    self.last_mtime = 0

    # Top Toolbar
    toolbar = tk.Frame(root, bg="#f0f2f5", height=50)
    toolbar.pack(fill=tk.X, padx=10, pady=10)

    tk.Label(
        toolbar, text="WhereAbouts", font=("Arial", 16, "bold"), bg="#f0f2f5"
    ).pack(side=tk.LEFT)
    tk.Button(
        toolbar,
        text="🔄 Refresh",
        command=self.load_data,
        bg="#fff",
        relief=tk.GROOVE,
    ).pack(side=tk.RIGHT, padx=5)
    tk.Button(
        toolbar,
        text="+ Add Event",
        command=self.open_add_event_window,
        bg="#0066cc",
        fg="white",
    ).pack(side=tk.RIGHT, padx=5)

    # Main Card Grid Container
    self.canvas = tk.Canvas(root, bg="#f7f9fc")
    self.scrollbar = ttk.Scrollbar(
        root, orient="vertical", command=self.canvas.yview
    )
    self.card_frame = tk.Frame(self.canvas, bg="#f7f9fc")

    self.card_frame.bind(
        "<Configure>",
        lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")),
    )
    self.canvas.create_window((0, 0), window=self.card_frame, anchor="nw")
    self.canvas.configure(yscrollcommand=self.scrollbar.set)

    self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10)
    self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    self.load_data()
    self.start_auto_sync()

  def load_data(self):
    # Clear existing cards
    for widget in self.card_frame.winfo_children():
      widget.destroy()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, title FROM members")
    members = cursor.fetchall()

    row, col = 0, 0
    for m_id, name, title in members:
      # Create individual member card (like in your screenshots)
      card = tk.Frame(
          self.card_frame,
          bg="white",
          bd=1,
          relief=tk.SOLID,
          width=250,
          height=180,
      )
      card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew")
      card.grid_propagate(False)

      tk.Label(
          card,
          text=name,
          font=("Arial", 11, "bold"),
          bg="white",
          anchor="w",
      ).pack(fill=tk.X, padx=10, pady=8)
      tk.Label(
          card, text=title, font=("Arial", 9), fg="gray", bg="white", anchor="w"
      ).pack(fill=tk.X, padx=10)

      # Fetch events for this member
      cursor.execute(
          "SELECT date, event_name, tag FROM events WHERE member_id = ?",
          (m_id,),
      )
      events = cursor.fetchall()

      event_box = tk.Frame(card, bg="#f0f4f8")
      event_box.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

      if not events:
        tk.Label(
            event_box,
            text="No upcoming events",
            font=("Arial", 8),
            fg="gray",
            bg="#f0f4f8",
        ).pack(anchor="w", padx=5, pady=5)
      else:
        for ev_date, ev_name, ev_tag in events:
          lbl_text = f"{ev_date}: {ev_name} [{ev_tag}]"
          tk.Label(
              event_box,
              text=lbl_text,
              font=("Arial", 8),
              bg="#e1effe",
              fg="#1e429f",
              anchor="w",
          ).pack(fill=tk.X, padx=2, pady=2)

      col += 1
      if col > 3:  # 4 cards per row
        col = 0
        row += 1

    conn.close()

  def open_add_event_window(self):
    # Popup window to add events / edit details
    win = tk.Toplevel(self.root)
    win.title("Add Event / Edit Details")
    win.geometry("350x300")

    tk.Label(win, text="Select Member:").pack(anchor="w", padx=15, pady=5)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name FROM members")
    members = cursor.fetchall()
    conn.close()

    member_names = [m[1] for m in members]
    member_var = tk.StringVar(win)
    if member_names:
      member_var.set(member_names[0])

    dropdown = ttk.Combobox(
        win, textvariable=member_var, values=member_names, state="readonly"
    )
    dropdown.pack(fill=tk.X, padx=15)

    tk.Label(win, text="Date (e.g., Nov 23):").pack(anchor="w", padx=15, pady=5)
    date_entry = tk.Entry(win)
    date_entry.pack(fill=tk.X, padx=15)

    tk.Label(win, text="Event Name / Status:").pack(
        anchor="w", padx=15, pady=5
    )
    event_entry = tk.Entry(win)
    event_entry.pack(fill=tk.X, padx=15)

    tk.Label(win, text="Tag (Training / AL / VL):").pack(
        anchor="w", padx=15, pady=5
    )
    tag_entry = tk.Entry(win)
    tag_entry.pack(fill=tk.X, padx=15)

    def save_event():
      selected_name = member_var.get()
      m_id = [m[0] for m in members if m[1] == selected_name][0]
      c = sqlite3.connect(DB_PATH)
      c.execute(
          "INSERT INTO events (member_id, date, event_name, tag) VALUES (?, ?,"
          " ?, ?)",
          (m_id, date_entry.get(), event_entry.get(), tag_entry.get()),
      )
      c.commit()
      c.close()
      win.destroy()
      self.load_data()

    tk.Button(
        win,
        text="Save Event",
        command=save_event,
        bg="#0066cc",
        fg="white",
        width=15,
    ).pack(pady=20)

  def start_auto_sync(self):
    # Background thread to check if another user modified the database file
    import os

    def poll_db():
      while True:
        try:
          mtime = os.path.getmtime(DB_PATH)
          if self.last_mtime == 0:
            self.last_mtime = mtime
          elif mtime != self.last_mtime:
            self.last_mtime = mtime
            self.root.after(0, self.load_data)  # Refresh UI on main thread
        except Exception:
          pass
        time.sleep(3)  # Check every 3 seconds

    threading.Thread(target=poll_db, daemon=True).start()


if __name__ == "__main__":
  root = tk.Tk()
  app = WhereAboutsApp(root)
  root.mainloop()
