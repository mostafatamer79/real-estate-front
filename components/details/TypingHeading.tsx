'use client';
import { useEffect, useRef } from 'react';
import styles from './details-explorer.module.css';

export default function TypingHeading({text, language, enabled}: {text: string; language: string; enabled: boolean}) {
  const output=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const element=output.current;
    if(!element)return;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setTimeout>;
    const finish=()=>{clearTimeout(timer);element.textContent=text;element.removeAttribute('data-writing');};
    if(!enabled||media.matches){finish();return;}
    const letters=Array.from(new Intl.Segmenter(language,{granularity:'grapheme'}).segment(text),part=>part.segment);
    let index=0; element.textContent='';element.setAttribute('data-writing','true');
    const write=()=>{element.textContent=letters.slice(0,++index).join('');if(index<letters.length)timer=setTimeout(write,language==='ar'?60:42);else element.removeAttribute('data-writing');};
    write();media.addEventListener('change',finish);
    return()=>{clearTimeout(timer);media.removeEventListener('change',finish);};
  },[text,language,enabled]);
  return <h1 className={styles.heading} aria-label={text}><span aria-hidden="true" className={styles.measure}>{text}</span><span aria-hidden="true" ref={output} className={styles.typed} /></h1>;
}
