"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Moon, Settings, Sun, X } from "lucide-react";

type Theme = "light" | "dark";
const STORAGE_KEY = "saobras-theme";

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    document.documentElement.setAttribute("data-theme", event.newValue === "dark" ? "dark" : "light");
    onChange();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("saobras-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("saobras-theme-change", onChange);
  };
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerTheme(): Theme { return "light"; }

export function ThemeSettings() {
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstOptionRef.current?.focus();
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function changeTheme(nextTheme: Theme) {
    document.documentElement.setAttribute("data-theme", nextTheme);
    try { localStorage.setItem(STORAGE_KEY, nextTheme); } catch { /* O tema funciona mesmo sem armazenamento disponível. */ }
    window.dispatchEvent(new Event("saobras-theme-change"));
  }

  return (
    <div ref={containerRef} className="theme-settings">
      <button ref={triggerRef} type="button" className="theme-toggle" aria-label="Configurações de aparência" title="Configurações de aparência" aria-expanded={open} aria-controls="theme-settings-panel" onClick={() => setOpen(!open)}>
        <Settings size={16} strokeWidth={1.7} aria-hidden="true" />
      </button>
      {open && (
        <section id="theme-settings-panel" className="theme-panel" aria-labelledby="theme-settings-title">
          <div className="theme-panel-heading">
            <h2 id="theme-settings-title">Aparência</h2>
            <button type="button" className="theme-panel-close" aria-label="Fechar configurações" onClick={() => { setOpen(false); triggerRef.current?.focus(); }}><X size={16} aria-hidden="true" /></button>
          </div>
          <p className="theme-panel-description">Escolha o tema do sistema.</p>
          <div className="theme-options" role="group" aria-label="Tema do sistema">
            {(["light", "dark"] as const).map((option) => {
              const Icon = option === "light" ? Sun : Moon;
              return (
                <button key={option} ref={option === "light" ? firstOptionRef : undefined} type="button" className="theme-option" aria-pressed={theme === option} onClick={() => changeTheme(option)}>
                  <Icon size={18} aria-hidden="true" />
                  <span>Modo {option === "light" ? "claro" : "escuro"}</span>
                  {theme === option && <Check size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className="theme-panel-note">Sua preferência fica salva neste navegador.</p>
        </section>
      )}
    </div>
  );
}
