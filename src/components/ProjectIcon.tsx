import Image from "next/image";
import { hueOf, nameOf } from "@/lib/model";

const projectIcons = new Map([
  ["beta", "/project-icons/prismfi.cc.ico"],
  ["lend", "/project-icons/lend.xyz.ico"],
]);

export function ProjectIcon({ id, name, compact = false }: { id: string; name?: string; compact?: boolean }) {
  const icon = projectIcons.get(id);
  const size = compact ? 18 : 26;
  const classes = "avatar project-icon" + (compact ? " compact" : "");
  return icon ? (
    <span className={classes + " branded"} data-project-icon={id} aria-hidden="true">
      <Image src={icon} width={size} height={size} alt="" unoptimized />
    </span>
  ) : (
    <span className={classes + " " + hueOf(id)} aria-hidden="true">
      {(name || nameOf(id)).slice(0, 1).toUpperCase()}
    </span>
  );
}
