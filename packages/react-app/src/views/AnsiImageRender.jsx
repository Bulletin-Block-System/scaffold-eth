import React, { useCallback, useEffect, useState } from "react";
import { default as AnsiUp } from 'ansi_up';
import './AnsiImageRender.css';

export default function AnsiImageRender({ tokenURI, extraClass, style }) {
  const [html, setNewState] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // tokenURI = 'ipfs://bafyreih4ki2rd2yow7yh6m3vyq27icq35dhtlpuuq3xa34aknzegpcvtu4/metadata.json';
  useEffect(() => {
    fetchHtml(tokenURI);
  }, [tokenURI]);
  

  const fetchHtml = (url) => {
    if (!url || url == '')
      return;

    if (url.startsWith('ipfs://')) {
      url = url.replace('ipfs://', 'https://dweb.link/ipfs/');
      url = url.replaceAll(' ', '%20');
    }
    setIsFetching(true);

    if (url.endsWith('.json')) {
      fetch(url, {
        "method": "GET",
        "headers": {
        }
      })
        .then(response => response.json())
        .then(response => {
          let tokenUri = response.properties.srcFile ?? 'tna1.ans';
          fetchHtml(tokenUri);
        })
        .catch(err => {
          console.log(err);
          setIsFetching(false);
        });

    // } else if (url.endsWith('.ans')) {
      } else {
      fetch(url, {
        "method": "GET",
        "headers": {
        }
      })
        .then(response => response.arrayBuffer())
        .then(response => {

          let decoder = new TextDecoder('ISO-8859-1');
          let text = decoder.decode(response);

          const ansi_up = new AnsiUp();
          let htmlResp = ansi_up.ansi_to_html(text);
          setNewState(htmlResp);
          setIsFetching(false);
        })
        .catch(err => {
          console.log(err);
          setIsFetching(false);
        });
    }
  }

  if (!html && !isFetching) {
    fetchHtml(tokenURI);
  }

  return (
    <pre dangerouslySetInnerHTML={{ __html: html }} style={style} className={"ansi-img " + extraClass} >

    </pre>
  );
}
