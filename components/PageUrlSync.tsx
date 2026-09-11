'use client';

import { useEffect } from 'react';

export default function PageUrlSync() {
  useEffect(() => {
    const getPageFromPath = () => {
      const match = window.location.pathname.match(/^\/p\/(\d+)\/?$/);
      return match ? Math.max(1, Number(match[1])) : 1;
    };

    let lastPage = 0;
    let timer: number | undefined;

    const sync = () => {
      const text = document.body.innerText.match(/Page\s+(\d+)\s+of\s+(\d+)/i);
      if (!text) return;
      const currentPage = Number(text[1]);
      if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage === lastPage) return;
      lastPage = currentPage;
      const wantedPath = currentPage === 1 ? '/' : `/p/${currentPage}`;
      if (window.location.pathname !== wantedPath) window.history.replaceState({}, '', wantedPath);
    };

    const requestedPage = getPageFromPath();
    if (requestedPage > 1) {
      timer = window.setInterval(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find((el) => el.textContent?.trim() === String(requestedPage));
        if (button) {
          (button as HTMLButtonElement).click();
          if (timer) window.clearInterval(timer);
          timer = undefined;
        }
      }, 100);
    }

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    sync();

    return () => {
      observer.disconnect();
      if (timer) window.clearInterval(timer);
    };
  }, []);

  return null;
}
