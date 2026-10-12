import { site } from "./content.js";
const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const externalUrl = (value, hosts) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (!hosts || hosts.includes(url.hostname))
      ? url.href
      : null;
  } catch {
    return null;
  }
};
const youtubeUrl = (value) =>
  externalUrl(value, [
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "m.youtube.com",
  ]);
const youtubeId = (value) => {
  const safeUrl = youtubeUrl(value);
  if (!safeUrl) return null;
  const url = new URL(safeUrl);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = url.hostname === "youtu.be" ? parts[0]
    : url.pathname === "/watch" ? url.searchParams.get("v")
    : ["embed", "shorts"].includes(parts[0]) ? parts[1] : null;
  return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? id : null;
};
const heroId = youtubeId(site.heroVideo);
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
if (heroId) {
  const player = document.createElement("iframe");
  player.title = "Santhusta Foundation introduction — starts muted";
  player.src = `https://www.youtube-nocookie.com/embed/${heroId}?autoplay=${motionPreference.matches ? 0 : 1}&mute=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
  player.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
  player.allowFullscreen = true;
  player.referrerPolicy = "strict-origin-when-cross-origin";
  $("#hero-player").append(player);
}
const pauseHero = () => $("#hero-player iframe")?.contentWindow.postMessage(JSON.stringify({event:"command",func:"pauseVideo",args:[]}), "https://www.youtube-nocookie.com");
motionPreference.addEventListener("change", event => { if (event.matches) pauseHero(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseHero(); });
const gallery = $("#photo-gallery");
gallery.innerHTML = site.photos.map(photo =>
  `<article class="photo-card"><div class="photo-thumb"><img src="${escape(photo.image)}" alt="${escape(photo.alt)}" loading="lazy"></div><p class="eyebrow">${escape(photo.category)}</p><h3>${escape(photo.title)}</h3></article>`
).join("");
$("#team-grid").innerHTML = site.team
  .map(
    (person) =>
      `<article class="person">${person.image ? `<img class="person-photo" src="${escape(person.image)}" alt="${escape(person.name)}" loading="lazy">` : `<div class="person-placeholder" aria-label="Portrait coming soon"><span aria-hidden="true">${escape(person.initials)}</span><small>Portrait coming soon</small></div>`}<h3>${escape(person.name)}</h3><p class="person-role">${escape(person.role)}</p><p class="person-description">${escape(person.description)}</p></article>`,
  )
  .join("");
$("#metrics").innerHTML = site.metrics
  .map(
    ([value, label]) =>
      `<div class="metric"><strong>${escape(value)}</strong><p>${escape(label)}</p></div>`,
  )
  .join("");
$("#address").textContent = site.address;
$("#contact-email").textContent = `${site.email} ↗`;
$("#contact-email").href = `mailto:${site.email}`;
$("#phone").textContent = site.phone || "Phone number coming soon";
$("#social-links").innerHTML = [
  ["Instagram", site.instagram],
  ["LinkedIn", site.linkedin],
]
  .map(([label, url]) =>
    externalUrl(url)
      ? `<a href="${escape(externalUrl(url))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`
      : `<span>${label} · Coming soon</span>`,
  )
  .join("");
const menuButton = $(".menu-toggle");
const nav = $("#main-nav");
const closeMenu = () => {
  nav.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
};
menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
const navLinks = [...nav.querySelectorAll("a")];
const sections = navLinks.map((link) =>
  document.querySelector(link.getAttribute("href")),
);
let scrollQueued = false;
const updateNavigation = () => {
  const atBottom =
    window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 4;
  const current = atBottom
    ? sections.at(-1)
    : sections.reduce(
        (selected, section) =>
          section.getBoundingClientRect().top <= 145 ? section : selected,
        sections[0],
      );
  navLinks.forEach((link) => {
    const active = link.hash === `#${current.id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollQueued = false;
};
window.addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateNavigation);
    }
  },
  { passive: true },
);
updateNavigation();
const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const step = () =>
  gallery.querySelector(".photo-card").getBoundingClientRect().width + 23;
const scrollPhotos = (direction) =>
  gallery.scrollBy({
    left: direction * step(),
    behavior: reducedMotion() ? "instant" : "smooth",
  });
$("#previous-photo").addEventListener("click", () => scrollPhotos(-1));
$("#next-photo").addEventListener("click", () => scrollPhotos(1));
gallery.addEventListener("keydown", (event) => {
  if (event.target !== gallery) return;
  if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
    event.preventDefault();
    scrollPhotos(event.key === "ArrowRight" ? 1 : -1);
  }
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    gallery.scrollTo({
      left: event.key === "Home" ? 0 : gallery.scrollWidth,
      behavior: reducedMotion() ? "instant" : "smooth",
    });
  }
});
const updateCarousel = () => {
  $("#previous-photo").disabled = gallery.scrollLeft < 4;
  $("#next-photo").disabled =
    gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 4;
  const current = Math.min(
    site.photos.length,
    Math.round(gallery.scrollLeft / step()) + 1,
  );
  $("#carousel-status").textContent = `${current} / ${site.photos.length}`;
};
gallery.addEventListener("scroll", updateCarousel, { passive: true });
window.addEventListener("resize", updateCarousel);
updateCarousel();
const mediaDialog = $("#media-dialog");
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-video]");
  if (!trigger) return;
  const key = trigger.dataset.video;
  const video =
    key === "hero"
      ? {
          title: "Meet Santhusta Foundation",
          image: "assets/page-1-1.jpg",
          alt: "Children sharing a joyful moment",
          url: site.heroVideo,
        }
      : key === "founder"
        ? {
            title: "Meet Sridhar Neelam",
            image: "assets/page-3-1.jpg",
            alt: "Sridhar Neelam",
            url: site.founderVideo,
          }
        : null;
  if (!video) return;
  const id = youtubeId(video.url);
  $("#media-title").textContent = video.title;
  const localVideo = key === "founder" && /^assets\/[a-zA-Z0-9_-]+\.mp4$/.test(video.url || "");
  pauseHero();
  mediaDialog.classList.toggle("has-video", Boolean(id || localVideo));
  if (id) {
    const player = document.createElement("iframe");
    player.src = `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&autoplay=0&rel=0`;
    player.title = video.title;
    player.allow = "encrypted-media; fullscreen; picture-in-picture";
    player.allowFullscreen = true;
    player.referrerPolicy = "strict-origin-when-cross-origin";
    const wrapper = document.createElement("div");
    wrapper.className = "media-player";
    wrapper.append(player);
    $("#media-body").replaceChildren(wrapper);
  } else if (localVideo) {
    const player = document.createElement("video");
    player.src = video.url;
    player.controls = true;
    player.playsInline = true;
    player.preload = "metadata";
    player.setAttribute("aria-label", video.title);
    $("#media-body").replaceChildren(player);
    player.play().catch(() => {});
  } else {
    $("#media-body").innerHTML =
      `<div class="media-placeholder"><img src="${escape(video.image)}" alt="${escape(video.alt)}"><p><strong>This story is coming soon.</strong></p><small>Our video will be available here once it is ready. In the meantime, explore the programs and people behind our work.</small></div>`;
  }
  mediaDialog.showModal();
});
mediaDialog.addEventListener("close", () => {
  $("#media-body video")?.pause();
  $("#media-body").replaceChildren();
  mediaDialog.classList.remove("has-video");
});
const registrationForm = $("#registration-form");
const submitButton = $("#registration-submit");
const formStatus = $("#registration-status");
let widgetId, submissionId = crypto.randomUUID(), submitting = false;
const status = (message, state = "info") => { formStatus.textContent = message; formStatus.dataset.state = state; };
registrationForm.addEventListener("input", () => { submissionId = crypto.randomUUID(); });
let turnstileLoading;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileLoading) turnstileLoading = new Promise((resolve, reject) => {
    window.team100TurnstileReady = resolve;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=team100TurnstileReady&render=explicit";
    script.async = true;
    script.onerror = () => { script.remove(); turnstileLoading = null; reject(new Error("Verification could not load. Please reopen the form to retry.")); };
    document.head.append(script);
  });
  return turnstileLoading;
}
$("#join-button").addEventListener("click", async () => {
  $("#registration-dialog").showModal();
  if (widgetId !== undefined || submitting) return;
  try {
    const response = await fetch("/api/registration-config", { cache: "no-store" });
    const config = await response.json();
    if (!response.ok || !config.ready) throw new Error("Registration is not accepting responses yet. Please contact sridhar@santhusta.org.");
    await loadTurnstile();
    widgetId = window.turnstile.render("#turnstile-widget", {
      sitekey: config.siteKey, action: "registration", size: "flexible",
      callback: () => { if (!submitting) { submitButton.disabled = false; if (formStatus.dataset.state !== "success") status("Ready to submit."); } },
      "expired-callback": () => { submitButton.disabled = true; status("Please complete the verification again."); },
      "error-callback": () => { submitButton.disabled = true; status("Verification could not complete. Please retry.", "error"); }
    });
  } catch (error) { status(error.message.includes("Registration") || error.message.includes("Verification") ? error.message : "Registration is not accepting responses yet. Please contact sridhar@santhusta.org.", "error"); }
});
registrationForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (submitting || widgetId === undefined || !registrationForm.reportValidity()) return;
  const token = window.turnstile.getResponse(widgetId);
  if (!token) { status("Please complete the verification.", "error"); return; }
  const data = Object.fromEntries(new FormData(registrationForm));
  data.consent = data.consent === "on";
  data.token = token;
  data.submissionId = submissionId;
  submitting = true; submitButton.disabled = true; registrationForm.querySelector("fieldset").disabled = true;
  status("Sending your details…");
  try {
    const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: AbortSignal.timeout(30000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.message || "We could not confirm your submission. Please retry.");
    registrationForm.reset(); submissionId = crypto.randomUUID();
    status("Thank you! Your interest has been recorded. Team 100 can now contact you.", "success");
  } catch (error) { status(error.name === "TimeoutError" ? "We could not confirm your submission. Please retry; the same submission will not be saved twice." : error.message, "error"); }
  finally { submitting = false; registrationForm.querySelector("fieldset").disabled = false; window.turnstile.reset(widgetId); submitButton.disabled = true; }
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  });
});

const founderVideo = $("#founder-video");
const founderUnmute = $("#founder-unmute");
if (founderVideo) {
  new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) founderVideo.play().catch(() => {});
      else founderVideo.pause();
    }
  }, { threshold: 0.5 }).observe(founderVideo);
  founderUnmute.addEventListener("click", () => {
    founderVideo.muted = false;
    founderVideo.play().catch(() => {});
  });
  founderVideo.addEventListener("volumechange", () => {
    founderUnmute.hidden = !founderVideo.muted;
  });
}
