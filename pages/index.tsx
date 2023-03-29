import { useEffect, useState } from "react";
import { NextPageContext } from "next";
import Image from "next/image";
import Head from "next/head";

import unfetch from "isomorphic-unfetch";
import { InputSuggestions } from "react-input-suggestions";
import { removeRepeat, shuffle } from "@/libs/utils";

import styles from "@/styles/Home.module.css";

interface PageProps {
  data: {
    songs: [
      {
        uri: String;
        name: String;
        displayName: String;
      }
    ];
    posibilities: String[];
  };
}

const Status = {
  HIDE: "hide",
  SUCCESS: "success",
  FAILED: "failed",
};

export default function Home({ data }: PageProps) {
  const { songs, posibilities } = data;
  const [points, setPoints] = useState(0);
  const [songIndex, setSongIndex] = useState(0);
  const [totalGuessed, setTotalGuessed] = useState(0);
  const [lifes, setLifes] = useState(3);
  const [currentInput, setInput] = useState("");
  const [state, setState] = useState(Status.HIDE);
  const currentSong = songs[songIndex];

  useEffect(() => {
    if (lifes <= 0) {
      setState(Status.FAILED);
      setTimeout(() => {
        nextSong();
        setPoints(0);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifes]);

  useEffect(() => {
    if (!currentSong) {
      alert("Game finished.");
    }
  }, [currentSong]);

  function nextSong() {
    setLifes(3);
    setState(Status.HIDE);
    setSongIndex(songIndex + 1);
    setInput("");
  }

  function guess() {
    if (currentInput.toLowerCase() == currentSong.displayName.toLowerCase()) {
      setState(Status.SUCCESS);
      setPoints(points + 1);
      setTotalGuessed(totalGuessed + 1);
      setTimeout(() => {
        nextSong();
      }, 3000);
    } else {
      setLifes(lifes - 1);
    }
  }

  return (
    <>
      <Head>
        <title>OSTGuess</title>
        <meta name="description" content="OST Guesser" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Image src={"/peped.gif"} alt={"pepeD"} width={"100"} height={"84"} />

        <h1 className={styles["title-" + state]}>{currentSong?.displayName}</h1>
        <p className={styles.text}>
          Current strike: {points} | total guessed: {totalGuessed} | current
          song: {songIndex + 1}/{songs.length}
        </p>

        <div className={styles.section}>
          <input
            className={styles.input}
            value={currentInput}
            onChange={(e) => setInput(e.target.value)}
            list={"posibilities"}
          ></input>

          <datalist id="posibilities">
            {posibilities.map((v, k) => (
              <option key={k} value={v as string}>
                {v}
              </option>
            ))}
          </datalist>
        </div>

        <div className={styles.section}>
          <button
            className={styles.btn}
            onClick={guess}
            disabled={state != Status.HIDE}
          >
            Guess ({lifes}/3)
          </button>
        </div>

        <div className={styles.player}>
          <audio
            src={
              "https://cdn.sammwy.com/game-assets/ostguess/" + currentSong?.uri
            }
            controls={true}
            controlsList="nodownload"
            autoPlay={true}
            loop={true}
          ></audio>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(_context: NextPageContext) {
  const req = await unfetch(
    "https://cdn.sammwy.com/game-assets/ostguess/data.json"
  );

  const data = await req.json();
  data.songs = shuffle(data.songs);
  data.posibilities = removeRepeat(data.posibilities);

  return {
    props: { data },
  };
}
