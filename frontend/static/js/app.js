/* =========================================================
   Behind the Mind — frontend logic
   Talks ONLY to the Flask proxy (/api/*), which forwards to FastAPI.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Theme ---------- */
  const html = document.documentElement;
  const themeBtn = document.getElementById("themeToggle");
  const saved = localStorage.getItem("btm_theme") || "light";

  html.setAttribute("data-theme", saved);
  updateThemeLabel(saved);

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next =
        html.getAttribute("data-theme") === "light"
          ? "dark"
          : "light";

      html.setAttribute("data-theme", next);
      localStorage.setItem("btm_theme", next);
      updateThemeLabel(next);
    });
  }

  function updateThemeLabel(theme) {
    const label = document.querySelector(".theme-label");

    if (label) {
      label.textContent = theme === "light" ? "Light" : "Dark";
    }
  }

  /* ---------- Backend health ---------- */
  const dot = document.getElementById("backendDot");
  const status = document.getElementById("backendStatus");

  fetch("/api/health")
    .then((response) =>
      response.json().then((data) => ({
        ok: response.ok,
        data: data
      }))
    )
    .then(({ ok }) => {
      if (dot) {
        dot.classList.toggle("dot-green", ok);
      }

      if (status) {
        status.textContent = ok
          ? "Backend online"
          : "Backend offline";
      }
    })
    .catch(() => {
      if (status) {
        status.textContent = "Backend offline";
      }
    });

  /* ---------- Shared API helper ---------- */
  async function api(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body || {})
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data.error ||
        data.description ||
        `Request failed (${response.status})`;

      throw new Error(message);
    }

    return data;
  }

  /* =========================================================
     MARKDOWN RENDERING
     ========================================================= */

  function renderMarkdown(content) {
    const text = String(content || "");

    /*
     * If marked or DOMPurify is unavailable,
     * safely display the response as plain text.
     */
    if (
      typeof marked === "undefined" ||
      typeof DOMPurify === "undefined"
    ) {
      return escapeHtml(text).replace(/\n/g, "<br>");
    }

    const htmlContent = marked.parse(text, {
      breaks: true,
      gfm: true
    });

    return DOMPurify.sanitize(htmlContent);
  }

  /* =========================================================
     CHAT
     ========================================================= */

  if (window.BTM_PAGE === "chat") {
    const win = document.getElementById("chatWindow");
    const inp = document.getElementById("chatInput");
    const send = document.getElementById("chatSend");

    const history = [];

    function bubble(role, content, tool) {
      const wrap = document.createElement("div");
      wrap.className = `msg ${role}`;

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent =
        role === "user" ? "🧑" : "🧠";

      const body = document.createElement("div");

      const bubbleElement = document.createElement("div");
      bubbleElement.className = "bubble";

      if (role === "assistant") {
        /*
         * AI response:
         * Markdown -> HTML -> sanitized HTML
         */
        bubbleElement.innerHTML =
          renderMarkdown(content);
      } else {
        /*
         * User message remains plain text.
         */
        bubbleElement.textContent = content;
      }

      body.appendChild(bubbleElement);

      if (tool) {
        const tag = document.createElement("span");
        tag.className = "tooltag";
        tag.textContent = `tool: ${tool}`;
        body.appendChild(tag);
      }

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

      body.appendChild(meta);

      wrap.appendChild(avatar);
      wrap.appendChild(body);

      win.appendChild(wrap);
      win.scrollTop = win.scrollHeight;
    }

    function renderAll() {
      win.innerHTML = "";

      history.forEach((message) => {
        bubble(
          message.role,
          message.content,
          message.tool
        );
      });
    }

    /* ---------- Initial greeting ---------- */

    history.push({
      role: "assistant",
      content:
        "Hello! I'm Behind the Mind.\n\n" +
        "I'm here to listen and support you. " +
        "You can share whatever is on your mind, " +
        "and we'll work through it together. 💙"
    });

    renderAll();

    /* ---------- Prefill from mood chip ---------- */

    const prefill =
      sessionStorage.getItem("btm_prefill");

    if (prefill) {
      sessionStorage.removeItem("btm_prefill");
      inp.value = prefill;
      sendMessage();
    }

    /* ---------- Enter key ---------- */

    inp.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    });

    /* ---------- Send button ---------- */

    send.addEventListener(
      "click",
      sendMessage
    );

    /* ---------- Send message ---------- */

    async function sendMessage() {
      const text = inp.value.trim();

      if (!text) {
        return;
      }

      inp.value = "";

      history.push({
        role: "user",
        content: text
      });

      bubble("user", text);

      /* ---------- Typing indicator ---------- */

      const typing = document.createElement("div");

      typing.className = "msg assistant";

      typing.innerHTML = `
        <div class="avatar">🧠</div>
        <div>
          <div class="bubble typing">
            <span>•</span>
            <span>•</span>
            <span>•</span>
          </div>
        </div>
      `;

      win.appendChild(typing);
      win.scrollTop = win.scrollHeight;

      /* ---------- Backend request ---------- */

      try {
        const data = await api(
          "/api/ask",
          {
            message: text
          }
        );

        typing.remove();

        history.push({
          role: "assistant",
          content: data.response,
          tool: data.tool_called
        });

        bubble(
          "assistant",
          data.response,
          data.tool_called
        );
      } catch (error) {
        typing.remove();

        bubble(
          "assistant",
          `⚠️ ${error.message}`
        );
      }
    }
  }

  /* =========================================================
     THERAPIST
     ========================================================= */

  if (window.BTM_PAGE === "therapist") {
    const form =
      document.getElementById("therapistForm");

    const locationInput =
      document.getElementById(
        "therapistLocation"
      );

    const results =
      document.getElementById(
        "therapistResults"
      );

    form.addEventListener(
      "submit",
      async (event) => {
        event.preventDefault();

        const location =
          locationInput.value.trim();

        if (!location) {
          return;
        }

        results.innerHTML =
          `<div class="empty">` +
          `Searching for therapists near ` +
          `“${escapeHtml(location)}”…` +
          `</div>`;

        try {
          const data = await api(
            "/api/therapist",
            {
              location: location
            }
          );

          renderTherapistResult(data);
        } catch (error) {
          results.innerHTML =
            `<div class="empty">` +
            `⚠️ ${escapeHtml(error.message)}` +
            `</div>`;
        }
      }
    );

    function renderTherapistResult(data) {
      results.innerHTML = "";

      const card =
        document.createElement("div");

      card.className = "t-card";

      const avatar =
        document.createElement("div");

      avatar.className = "t-avatar";
      avatar.textContent = "🧑‍⚕️";

      const body =
        document.createElement("div");

      const heading =
        document.createElement("p");

      heading.className = "t-name";
      heading.textContent =
        "Nearby professionals";

      const subtitle =
        document.createElement("p");

      subtitle.className = "t-sub";
      subtitle.textContent =
        "Live results from the backend (Google Maps).";

      const text =
        document.createElement("div");

      text.className = "bubble";
      text.style.marginTop = "12px";

      text.innerHTML = renderMarkdown(
        data.response || "(no results)"
      );

      body.appendChild(heading);
      body.appendChild(subtitle);
      body.appendChild(text);

      const actions =
        document.createElement("div");

      actions.className = "t-actions";

      if (data.tool_called) {
        const tag =
          document.createElement("span");

        tag.className = "tooltag";
        tag.textContent =
          `tool: ${data.tool_called}`;

        actions.appendChild(tag);
      }

      card.appendChild(avatar);
      card.appendChild(body);
      card.appendChild(actions);

      results.appendChild(card);
    }
  }

  /* =========================================================
     EMERGENCY
     ========================================================= */

  if (window.BTM_PAGE === "emergency") {
    const button =
      document.getElementById(
        "emergencyBtn"
      );

    const output =
      document.getElementById(
        "emergencyStatus"
      );

    button.addEventListener(
      "click",
      async () => {

        /*
         * Deliberate confirmation.
         * Never automatically trigger an emergency call.
         */
        const confirmed =
          window.confirm(
            "This will ask the AI agent to trigger " +
            "an emergency voice call to your " +
            "configured helpline. Continue?"
          );

        if (!confirmed) {
          return;
        }

        button.disabled = true;

        output.textContent =
          "Contacting the backend agent…";

        try {
          const data = await api(
            "/api/emergency",
            {
              note:
                "I need immediate emergency support."
            }
          );

          output.textContent =
            (data.response ||
              "Request sent.") +
            (
              data.tool_called
                ? `\n(tool: ${data.tool_called})`
                : ""
            );
        } catch (error) {
          output.textContent =
            `⚠️ ${error.message}`;
        } finally {
          button.disabled = false;
        }
      }
    );
  }

  /* =========================================================
     UTILITY
     ========================================================= */

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      function (character) {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        };

        return entities[character];
      }
    );
  }

})();
