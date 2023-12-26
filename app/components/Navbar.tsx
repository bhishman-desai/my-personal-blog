import Link from "next/link";
import { FaGithub, FaLaptop, FaLinkedin } from "react-icons/fa";
import { IoHomeOutline } from "react-icons/io5";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 p-4 sticky top-0 drop-shadow-xl z-10">
      <div className="md:px-6 prose-xl mx-auto flex justify-between sm:flex-row">
        <h1 className="text-3xl font-bold text-white grid place-content-center mb-2 md:mb-0">
          <Link
            href="/"
            className="text-white/90 no-underline hover:text-white"
          >
            <IoHomeOutline />
          </Link>
        </h1>
        <div className="flex flex-row justify-center sm:justify-evenly align-middle gap-4 text-white text-4xl">
          <Link
            className="text-white/90 hover:text-white"
            href="https://bhishman.vercel.app/"
            target="_blank"
          >
            <FaLaptop />
          </Link>

          <Link
            className="text-white/90 hover:text-white"
            href="https://linkedin.com/in/bhishman-desai"
            target="_blank"
          >
            <FaLinkedin />
          </Link>

          <Link
            className="text-white/90 hover:text-white"
            href="https://github.com/bhishman-desai"
            target="_blank"
          >
            <FaGithub />
          </Link>
        </div>
      </div>
    </nav>
  );
}
