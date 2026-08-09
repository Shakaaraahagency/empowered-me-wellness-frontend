/**
 * EMWModal — custom alert/confirm replacement.
 * Usage:
 *   await EMWModal.alert("Message here");
 *   await EMWModal.alert("Message", { title: "Heads up" });
 *   const ok = await EMWModal.confirm("Delete this permanently?");
 *   const ok = await EMWModal.confirm("Cancel this booking?", { danger: true, confirmLabel: "Cancel booking" });
 *
 * Both resolve once the user dismisses the modal. confirm() resolves
 * true/false depending on which button was pressed. Escape key and
 * clicking the overlay both count as "cancel".
 */
const EMWModal = (() => {
  let overlay = null;
  let modal = null;

  function ensureDom() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "emw-modal-overlay";
    overlay.setAttribute("role", "presentation");
    overlay.innerHTML = `
      <div class="emw-modal" role="alertdialog" aria-modal="true" aria-labelledby="emw-modal-title" aria-describedby="emw-modal-body">
        <svg class="emw-modal-icon" id="emw-modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h3 id="emw-modal-title"></h3>
        <p id="emw-modal-body"></p>
        <div class="emw-modal-actions" id="emw-modal-actions"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    modal = overlay.querySelector(".emw-modal");
  }

  function open() {
    ensureDom();
    overlay.classList.add("is-open");
    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.removeEventListener("keydown", onKeydown);
  }

  let activeCancel = null;
  function onKeydown(e) {
    if (e.key === "Escape" && activeCancel) activeCancel();
  }

  function alertFn(message, opts = {}) {
    ensureDom();
    const { title = "Notice" } = opts;
    return new Promise((resolve) => {
      overlay.querySelector("#emw-modal-title").textContent = title;
      overlay.querySelector("#emw-modal-body").textContent = message;
      overlay.querySelector("#emw-modal-icon").classList.remove("is-danger");
      const actions = overlay.querySelector("#emw-modal-actions");
      actions.innerHTML = `<button type="button" class="btn" id="emw-modal-ok">OK</button>`;

      const done = () => { close(); resolve(); };
      activeCancel = done;
      overlay.onclick = (e) => { if (e.target === overlay) done(); };
      actions.querySelector("#emw-modal-ok").addEventListener("click", done);
      actions.querySelector("#emw-modal-ok").focus();
      open();
    });
  }

  function confirmFn(message, opts = {}) {
    ensureDom();
    const {
      title = "Are you sure?",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      danger = false,
    } = opts;
    return new Promise((resolve) => {
      overlay.querySelector("#emw-modal-title").textContent = title;
      overlay.querySelector("#emw-modal-body").textContent = message;
      overlay.querySelector("#emw-modal-icon").classList.toggle("is-danger", danger);
      const actions = overlay.querySelector("#emw-modal-actions");
      actions.innerHTML = `
        <button type="button" class="btn btn-ghost" id="emw-modal-cancel">${escapeHtml(cancelLabel)}</button>
        <button type="button" class="btn ${danger ? "btn-destructive" : ""}" id="emw-modal-confirm">${escapeHtml(confirmLabel)}</button>
      `;

      const finish = (result) => { close(); resolve(result); };
      activeCancel = () => finish(false);
      overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
      actions.querySelector("#emw-modal-cancel").addEventListener("click", () => finish(false));
      actions.querySelector("#emw-modal-confirm").addEventListener("click", () => finish(true));
      actions.querySelector("#emw-modal-confirm").focus();
      open();
    });
  }

  function promptConfirm(message, opts = {}) {
    ensureDom();
    const {
      title = "Are you sure?",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      expectedValue = "DELETE",
      danger = true,
    } = opts;
    return new Promise((resolve) => {
      overlay.querySelector("#emw-modal-title").textContent = title;
      overlay.querySelector("#emw-modal-icon").classList.toggle("is-danger", danger);

      // Swap the <p> body for a <div> so we can add a message + input inside it
      const oldBody = overlay.querySelector("#emw-modal-body");
      const container = document.createElement("div");
      container.id = "emw-modal-body";
      oldBody.replaceWith(container);

      const msgP = document.createElement("p");
      msgP.style.marginBottom = "12px";
      msgP.textContent = message;
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Type "${expectedValue}" to confirm`;
      input.style.cssText = "width:100%;padding:10px 12px;border:1px solid var(--sand);border-radius:8px;font-family:var(--font-body);font-size:14px;";
      container.appendChild(msgP);
      container.appendChild(input);

      const actions = overlay.querySelector("#emw-modal-actions");
      actions.innerHTML = `
        <button type="button" class="btn btn-ghost" id="emw-modal-cancel">${escapeHtml(cancelLabel)}</button>
        <button type="button" class="btn ${danger ? "btn-destructive" : ""}" id="emw-modal-confirm" disabled>${escapeHtml(confirmLabel)}</button>
      `;
      const confirmBtn = actions.querySelector("#emw-modal-confirm");
      input.addEventListener("input", () => {
        confirmBtn.disabled = input.value !== expectedValue;
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !confirmBtn.disabled) confirmBtn.click();
      });

      const finish = (result) => { close(); resolve(result); };
      activeCancel = () => finish(false);
      overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
      actions.querySelector("#emw-modal-cancel").addEventListener("click", () => finish(false));
      confirmBtn.addEventListener("click", () => finish(true));
      open();
      setTimeout(() => input.focus(), 50);
    });
  }

  return { alert: alertFn, confirm: confirmFn, promptConfirm };
})();
