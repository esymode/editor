import * as React from "react";
import { useRef, useEffect } from "react";

const putSourceIntoIframe = async function(
  iframe: HTMLIFrameElement,
  source: string
) {
  iframe.src = "";

  iframe.onload = async () => {
    const iframeDoc = iframe.contentDocument!;

    const srcScript = (src: string): HTMLScriptElement => {
      const script = iframeDoc.createElement("script");
      script.innerHTML = src;
      return script;
    };

    iframeDoc.body.appendChild(
      (() => {
        const div = iframeDoc.createElement("div");
        div.id = "root";
        return div;
      })()
    );
    iframeDoc.head.appendChild(srcScript(source));
  };
};

export const Preview: React.FC<{ source: string; className?: string }> = ({
  source,
  className
}) => {
  const outputRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      putSourceIntoIframe(outputRef.current, source);
    }
  }, [source]);

  return <iframe className={className} ref={outputRef} id="output"></iframe>;
};
// style={{ width: "100%", height: "350px", border: "1px solid grey" }}
