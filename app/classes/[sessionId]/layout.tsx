"use client";

import { useEffect } from "react";

export default function SessionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hide header and footer on this page
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    
    if (header) header.style.display = "none";
    if (footer) footer.style.display = "none";

    return () => {
      // Restore header and footer when leaving the page
      if (header) header.style.display = "";
      if (footer) footer.style.display = "";
    };
  }, []);

  return <>{children}</>;
}

