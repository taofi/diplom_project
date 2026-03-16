import Image from 'next/image';

export function Hero() {
  return (
    /* relative: для позиционирования Image fill
       w-screen: принудительно 100vw
       left-1/2 -ml-[50vw]: центрирование блока по оси X относительно экрана
    */
    <div className="relative h-[400px] w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
      
      <Image
        src="/banner.png"
        alt="Banner"
        fill
        className="object-cover"
        priority
      />

      {/* Контент (центрируем текст обратно, если нужно) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
        <h1 className="text-4xl text-primary md:text-5xl font-bold mb-4 max-w-3xl">
          Милые иллюстрации, паттерны, кисти для Procreate и Illustrator
        </h1>
      </div>
    </div>
  );
}