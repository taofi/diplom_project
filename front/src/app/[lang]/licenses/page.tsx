'use client';

import { useI18n } from '@/context/i18n/I18nContext';

export default function LicensesPage() {
  const { t } = useI18n();

  const personalAllowed = [
    t('licenses.personalAllowed1') || 'Использование в личных творческих проектах, не приносящих доход.',
    t('licenses.personalAllowed2') || 'Оформление личных аккаунтов в социальных сетях (не бизнес-профилей).',
    t('licenses.personalAllowed3') || 'Печать для личного пользования (подарки близким, декор дома) в единичных экземплярах.'
  ];

  const personalForbidden = [
    t('licenses.personalForbidden1') || 'Любое коммерческое использование (продажа товаров с этим дизайном).',
    t('licenses.personalForbidden2') || 'Использование в рекламе или для продвижения услуг/брендов.',
    t('licenses.personalForbidden3') || 'Перепродажа, передача файлов третьим лицам или размещение в открытом доступе.'
  ];

  const commercialAllowed = [
    t('licenses.commercialAllowed1') || 'Создание и продажа до 500 единиц конечной продукции (физической или цифровой: открытки, мерч, упаковка, принты).',
    t('licenses.commercialAllowed2') || 'Использование в одном бизнес-аккаунте социальной сети и на одном веб-сайте Покупателя.',
    t('licenses.commercialAllowed3') || 'Использование в цифровом дизайне, где исходный ресурс не может быть извлечен третьими лицами.'
  ];

  const commercialForbidden = [
    t('licenses.commercialForbidden1') || 'Превышение тиража в 500 единиц.',
    t('licenses.commercialForbidden2') || 'Использование в логотипах и товарных знаках.',
    t('licenses.commercialForbidden3') || 'Перепродажа исходных файлов в любом виде (даже после редактирования).'
  ];

  const extendedAllowed = [
    t('licenses.extendedAllowed1') || 'Использование без ограничения по тиражу (неограниченное количество единиц товара).',
    t('licenses.extendedAllowed2') || 'Создание логотипов, фирменного стиля и товарных знаков (без права эксклюзивного владения исходными элементами, так как они могут быть проданы другим лицам).',
    t('licenses.extendedAllowed3') || 'Использование в физической рекламе (билборды, полиграфия) и в неограниченном количестве бизнес-аккаунтов/сайтов Покупателя.',
    t('licenses.extendedAllowed4') || 'Использование в мобильных приложениях и играх.'
  ];

  const extendedForbidden = [
    t('licenses.extendedForbidden1') || 'Перепродажа «как есть», сублицензирование или передача файлов как самостоятельного ресурса.',
    t('licenses.extendedForbidden2') || 'Размещение на стоках, в фотобанках или использование в NFT-проектах.'
  ];

  const generalRestrictions = [
    t('licenses.restriction1') || 'Утверждать, что является автором произведения (даже после внесения значительных правок).',
    t('licenses.restriction2') || 'Распространять ссылку на скачивание или передавать исходные файлы третьим лицам.',
    t('licenses.restriction3') || 'Включать товары в цифровые наборы/конструкторы для перепродажи, где исходный элемент может быть извлечен в первоначальном виде.',
    t('licenses.restriction4') || 'Использовать товары в проектах, нарушающих законодательство РФ, пропагандирующих ненависть или дискриминацию.'
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 mt-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        {t('licenses.title') || 'Условия использования цифровых товаров (лицензии)'}
      </h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-8">
          Настоящее Соглашение определяет порядок использования цифровых товаров (графики, шаблонов, кистей и иных ресурсов). Выбор типа лицензии осуществляется Покупателем в момент оформления заказа.
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('licenses.section1Title') || '1. ОБЩЕЕ ПОЛОЖЕНИЕ О РЕДАКТИРОВАНИИ'}
          </h2>
          <p className="text-gray-600">
            Если Покупатель дополнительно приобретает услугу по редактированию (изменению) цифрового товара силами Продавца или вносит изменения самостоятельно (в рамках разрешенных правок), ранее приобретенная лицензия в полной мере распространяется на измененную (отредактированную) версию товара. Все ограничения и права основной лицензии сохраняются для конечного результата.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('licenses.section2Title') || '2. ТИПЫ ЛИЦЕНЗИЙ'}
          </h2>
          
          <div className="bg-primary/20 border-l-4 border-primary p-6 mb-6 rounded-r-lg">
            <h3 className="text-xl font-semibold text-[--text] mb-3">
              {t('licenses.personalLicense') || 'А. ПОЛЬЗОВАТЕЛЬСКАЯ (ЛИЧНАЯ) ЛИЦЕНЗИЯ'}
            </h3>
            <p className="text-[--text]/80 mb-3">
              {t('licenses.personalLicenseDesc') || 'Предназначена для некоммерческого использования в личных целях.'}
            </p>
            
            <div className="mb-4">
              <p className="font-medium text-green-700 mb-2">
                {t('licenses.allowed') || 'Разрешено:'}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {personalAllowed.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="font-medium text-red-700 mb-2">
                {t('licenses.forbidden') || 'Запрещено:'}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {personalForbidden.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-secondary/30 border-l-4 border-secondary p-6 mb-6 rounded-r-lg">
            <h3 className="text-xl font-semibold text-[--text] mb-3">
              {t('licenses.commercialLicense') || 'Б. КОММЕРЧЕСКАЯ ЛИЦЕНЗИЯ'}
            </h3>
            <p className="text-[--text]/80 mb-3">
              {t('licenses.commercialLicenseDesc') || 'Предназначена для малого бизнеса и индивидуальных предпринимателей.'}
            </p>
            
            <div className="mb-4">
              <p className="font-medium text-green-700 mb-2">
                {t('licenses.allowed') || 'Разрешено:'}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {commercialAllowed.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="font-medium text-red-700 mb-2">
                {t('licenses.forbidden') || 'Запрещено:'}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {commercialForbidden.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-accent/20 border-l-4 border-accent p-6 mb-6 rounded-r-lg">
            <h3 className="text-xl font-semibold text-[--text] mb-3">
              {t('licenses.extendedLicense') || 'В. РАСШИРЕННАЯ ЛИЦЕНЗИЯ'}
            </h3>
            <p className="text-[--text]/80 mb-3">
              {t('licenses.extendedLicenseDesc') || 'Предназначена для масштабных коммерческих проектов и брендинга.'}
            </p>
            
            <div className="mb-4">
              <p className="font-medium text-green-700 mb-2">
                {t('licenses.allowed') || 'Разрешено:'}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {extendedAllowed.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="font-medium text-red-700 mb-2">
                {t('licenses.forbidden') || 'Запрещено:'}
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {extendedForbidden.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {t('licenses.section3Title') || '3. ОБЩИЕ ОГРАНИЧЕНИЯ (для всех типов лицензий)'}
          </h2>
          <p className="text-gray-600 mb-3">
            {t('licenses.generalRestrictions') || 'Покупатель не вправе:'}
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            {generalRestrictions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
