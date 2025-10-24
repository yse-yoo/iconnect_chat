<?php

class Lang
{
    const langs = [
        'ja' => '日本語',
        'en' => 'English - 英語',
        'es' => 'Español - スペイン語',
        'fr' => 'Français - フランス語',
        'de' => 'Deutsch - ドイツ語',
        'zh' => '中文 - 中国語',
        'vi' => 'Tiếng Việt - ベトナム語',
        'bn' => 'বাংলা - ベンガル語',
        'si' => 'සිංහල - シンハラ語',
        'id' => 'Bahasa Indonesia - インドネシア語',
        'ne' => 'नेपाली - ネパール語',
        'mn' => 'Монгол - モンゴル語',
        'my' => 'မြန်မာ - ミャンマー語',
    ];

    public static function getLangInfo($code)
    {
        $countryMap = [
            'ja' => 'JP',
            'en' => 'US',
            'es' => 'ES',
            'fr' => 'FR',
            'de' => 'DE',
            'zh' => 'CN',
            'vi' => 'VN',
            'bn' => 'BD',
            'si' => 'LK',
            'id' => 'ID',
            'ne' => 'NP',
            'mn' => 'MN',
            'my' => 'MM',
        ];

        return [
            'label' => self::langs[$code] ?? '',
            'lang_code' => $code . '-' . $countryMap[$code],
        ];
    }
}
