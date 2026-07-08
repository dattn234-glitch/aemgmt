import bell from "../assets/icons3d/bell.webp";
import broom from "../assets/icons3d/broom.webp";
import bucket from "../assets/icons3d/bucket.webp";
import calendar from "../assets/icons3d/calendar.webp";
import chat from "../assets/icons3d/chat.webp";
import clipboard from "../assets/icons3d/clipboard.webp";
import house from "../assets/icons3d/house.webp";
import key from "../assets/icons3d/key.webp";
import money from "../assets/icons3d/money.webp";
import packageIcon from "../assets/icons3d/package.webp";
import phone from "../assets/icons3d/phone.webp";
import soap from "../assets/icons3d/soap.webp";
import sparkles from "../assets/icons3d/sparkles.webp";
import star from "../assets/icons3d/star.webp";
import { cn } from "../lib/utils";

const iconMap = {
  bell,
  broom,
  bucket,
  calendar,
  chat,
  clipboard,
  house,
  key,
  money,
  package: packageIcon,
  phone,
  soap,
  sparkles,
  star
} as const;

export type Icon3DName = keyof typeof iconMap;

type Icon3DProps = {
  className?: string;
  name: Icon3DName;
  size?: number;
  tile?: boolean;
};

export function Icon3D({ className, name, size = 44, tile = true }: Icon3DProps) {
  const image = (
    <img
      alt=""
      aria-hidden="true"
      className="shrink-0 object-contain"
      draggable={false}
      height={size}
      src={iconMap[name]}
      width={size}
    />
  );

  if (!tile) {
    return image;
  }

  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-2xl bg-primary-soft p-2", className)}
      style={{ width: size + 16, height: size + 16 }}
    >
      {image}
    </span>
  );
}
