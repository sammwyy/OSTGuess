import { useEffect, useState } from "react";
import { NextPageContext } from "next";
import Image from "next/image";
import Head from "next/head";

import { Shake } from "reshake";
import unfetch from "isomorphic-unfetch";
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
  let { songs, posibilities } = data;

  const [gameSongs, setGameSongs] = useState(songs);
  const [points, setPoints] = useState(0);
  const [songIndex, setSongIndex] = useState(0);
  const [totalGuessed, setTotalGuessed] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [started, setStarted] = useState(false);
  const [lifes, setLifes] = useState(3);
  const [currentInput, setInput] = useState("");
  const [state, setState] = useState(Status.HIDE);

  const currentSong = gameSongs[songIndex];
  const disabled = currentInput == "" || state != Status.HIDE || wrong;

  function saveGame() {
    const savedGame = {
      points,
      songIndex,
      totalGuessed,
      songs: gameSongs,
      lifes,
      version: 1,
    };
    const savedGameRaw = JSON.stringify(savedGame);
    window.localStorage.setItem("save", savedGameRaw);
  }

  function loadGame() {
    const savedGameRaw = window.localStorage.getItem("save");
    if (savedGameRaw) {
      const savedGame = JSON.parse(savedGameRaw);
      setPoints(savedGame.points);
      setSongIndex(savedGame.songIndex);
      setTotalGuessed(savedGame.totalGuessed);
      setLifes(savedGame.lifes);

      const indexedSongs = savedGame.songs;

      for (const song of songs) {
        if (!indexedSongs.some((indexed: any) => indexed.uri == song.uri)) {
          indexedSongs.push(song);
        }
      }

      setGameSongs(indexedSongs);
      setStarted(true);
    }
  }

  useEffect(() => {
    if (started) {
      saveGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, points, songIndex, totalGuessed, lifes]);

  useEffect(() => {
    loadGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key == "Enter") {
        guess();
      }
    };

    window.addEventListener("keydown", listener);
    return () => {
      window.removeEventListener("keydown", listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wrong) {
      setWrong(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInput]);

  useEffect(() => {
    if (wrong) {
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
      }, 200);
    }
  }, [wrong]);

  useEffect(() => {
    if (lifes <= 0) {
      setState(Status.FAILED);
      setTimeout(() => {
        nextSong();
        setPoints(0);
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifes, points, songIndex]);

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
    if (!disabled) {
      if (currentInput.toLowerCase() == currentSong.displayName.toLowerCase()) {
        setState(Status.SUCCESS);
        setPoints(points + 1);
        setTotalGuessed(totalGuessed + 1);
        setTimeout(() => {
          nextSong();
        }, 3000);
      } else {
        setLifes(lifes - 1);
        setWrong(true);
      }
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
      <main className={`${styles.wrapper}`}>
        <Shake
          h={shaking ? 50 : 0}
          v={shaking ? 50 : 0}
          r={0}
          dur={100}
          int={5.9}
          max={100}
          fixed={true}
          fixedStop={false}
        >
          <div className={`${styles.main}`}>
            {state != Status.HIDE && (
              <h1 className={styles["title-" + state]}>
                {currentSong?.displayName}
              </h1>
            )}

            {state == Status.HIDE && (
              <Image
                src={"/unknown.avif"}
                className={styles["title-" + state]}
                alt={"???"}
                width={"80"}
                height={"80"}
              ></Image>
            )}

            <div className={styles.lifes}>
              {Array.from(Array(lifes), (_, i) => (
                <Image
                  key={i}
                  src={"/peped.gif"}
                  alt={"pepeD"}
                  width={"100"}
                  height={"84"}
                />
              ))}
            </div>

            <p className={styles.text}>
              Current strike: {points} | total guessed: {totalGuessed} | current
              song: {songIndex + 1}/{songs.length}
            </p>

            <div className={styles.section}>
              <input
                className={styles["input" + (wrong ? "-wrong" : "")]}
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
                className={styles[`btn${disabled ? "-disabled" : ""}`]}
                onClick={guess}
                disabled={disabled}
              >
                Guess ({lifes}/3)
              </button>
            </div>

            <div className={styles.player}>
              <audio
                src={
                  "https://cdn.sammwy.com/game-assets/ostguess/" +
                  currentSong?.uri
                }
                controls={true}
                controlsList="nodownload"
                autoPlay={true}
                loop={true}
              ></audio>
            </div>
          </div>
        </Shake>
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
