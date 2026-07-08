import bell from "../assets/icons3d/bell.png";
import broom from "../assets/icons3d/broom.png";
import bucket from "../assets/icons3d/bucket.png";
import calendar from "../assets/icons3d/calendar.png";
import chat from "../assets/icons3d/chat.png";
import clipboard from "../assets/icons3d/clipboard.png";
import house from "../assets/icons3d/house.png";
import key from "../assets/icons3d/key.png";
import money from "../assets/icons3d/money.png";
import packageIcon from "../assets/icons3d/package.png";
import phone from "../assets/icons3d/phone.png";
import soap from "../assets/icons3d/soap.png";
import sparkles from "../assets/icons3d/sparkles.png";
import star from "../assets/icons3d/star.png";
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
