'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onPick: (emoji: string) => void;
  onClose: () => void;
}

const CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥺','😢','😭','😤','😠','😡','🤬','🤡','👻','💀','👽','🤖'],
  },
  {
    name: 'Gestures',
    emojis: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤝','🙏','💪','🦾','✍️','💅','🤳','💃','🕺'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌','💋','😻'],
  },
  {
    name: 'Fun',
    emojis: ['🔥','✨','⭐','🌟','💫','⚡','💥','💯','🎉','🎊','🎈','🎁','🎂','🍰','🍕','🍔','🍟','🌮','🍣','🍜','☕','🍺','🍻','🥂','🎯','🎮','🎲','🎸','🎤','🎧','🎬','📸','🏆','🥇','🎖️','🏅'],
  },
  {
    name: 'Nature',
    emojis: ['🌸','🌹','🌺','🌻','🌼','🌷','🌱','🌿','🍀','🌳','🌲','🌴','🌵','🌾','🌊','☀️','🌙','⭐','⛅','🌈','❄️','☃️','🔥','🌍','🌎','🌏','🪐','🦋','🐝','🐞','🐢','🐬','🦅'],
  },
  {
    name: 'Symbols',
    emojis: ['✅','❌','❎','✔️','☑️','⭕','🚫','⚠️','❗','❓','💡','🔔','🔕','🔒','🔓','🔑','🔍','📍','📌','🎵','🎶','💤','💬','💭','🗯️','🕐','⏰','⏳','📅','📆','🚀','✈️','🚗','🏠','🏢','💻','📱','⌨️'],
  },
];

export function EmojiPicker({ onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 left-0 z-50 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setActiveCategory(i)}
            className={
              'px-3 py-2 text-xs font-semibold whitespace-nowrap transition ' +
              (activeCategory === i
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-b-2 border-transparent')
            }
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-1 p-3 max-h-56 overflow-y-auto">
        {CATEGORIES[activeCategory].emojis.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPick(emoji)}
            className="text-2xl p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition leading-none"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}