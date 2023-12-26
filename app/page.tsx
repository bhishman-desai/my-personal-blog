import Posts from "./components/Posts";
import MyProfilePic from "@/app/components/MyProfilePic";

export const revalidate = 10;

export default function Home() {
  return (
    <main className="px-6 mx-auto">
      <MyProfilePic />
      <p className="mt-12 mb-12 text-3xl text-center dark:text-white">
        Hey there👋&nbsp;
        <span className="whitespace-nowrap">
          I&apos;m <span className="font-bold">Bhishman</span>.
        </span>
      </p>
      <Posts />
    </main>
  );
}
