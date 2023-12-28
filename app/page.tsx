import Posts from "./components/Posts";
import MyProfilePic from "@/app/components/MyProfilePic";
import React from "react";

export const revalidate = 86400;

export default function Home() {
  return (
    <div className="mx-auto">
      <MyProfilePic />
      <p className="mt-12 mb-12 text-3xl text-center dark:text-white">
        Hey there👋&nbsp;
        <span className="whitespace-nowrap">
          I'm <span className="font-bold">Bhishman</span>.
        </span>
      </p>
      {/*@ts-ignore*/}
      <Posts />
    </div>
  );
}
