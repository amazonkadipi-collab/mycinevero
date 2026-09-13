import { tmdbImage } from '@/lib/tmdb';

type CastMember = { id:number; character?:string; name:string; profile_path:string|null };

export default function CineveroCastAvatars({ cast }: { cast: CastMember[] }) {
  return <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
    {cast.slice(0,12).map((person) => <div key={`${person.id}-${person.character || ''}`} className="group min-w-[96px] snap-start sm:min-w-0">
      <div className="mx-auto aspect-square w-[92px] overflow-hidden rounded-full border-2 border-[#d8edf3] bg-[#edf8fb] shadow-[0_5px_18px_rgba(22,138,173,0.10)] transition duration-200 group-hover:-translate-y-1 group-hover:border-[#ffb2a5] group-hover:shadow-[0_10px_22px_rgba(22,138,173,0.16)] sm:w-full sm:max-w-[118px]">
        {person.profile_path ? <img src={tmdbImage(person.profile_path, 'w342')} alt={person.name} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <div className="flex h-full items-center justify-center text-[10px] font-bold text-[#9ab0bf]">No photo</div>}
      </div>
      <div className="mx-auto mt-2 max-w-[118px] text-center"><p className="line-clamp-1 text-xs font-bold">{person.name}</p><p className="mt-0.5 line-clamp-1 text-[10px] text-[#7891a3]">{person.character || ''}</p></div>
    </div>)}
  </div>;
}
