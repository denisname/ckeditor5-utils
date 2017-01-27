/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module utils/translation-service
 */

const translations = {};

/**
 * Merges package translations to existing ones.
 * These translations can be used later with {@link module:utils/translations-service~translate translate}
 *
 *		add( 'pl', {
 *			'OK': 'OK',
 *			'Cancel [context: reject]': 'Anuluj'
 *		} );OK
 *
 * @param {String} lang
 * @param {Object.<String, Object>} packageDictionary
 * @returns undefined
 */
export function add( lang, packageDictionary ) {
	if ( !( lang in translations ) ) {
		translations[ lang ] = {};
	}

	const dictionary = translations[ lang ];

	for ( const translationKey in packageDictionary ) {
		const translation = packageDictionary[ translationKey ];
		dictionary[ translationKey ] = translation;
	}
}

/**
 * Translates string if the translation of the string was previously added using {@link module:utils/translations-service~add add}.
 * Otherwise returns original (English) sentence.
 *
 *		translate( 'pl', 'Cancel [context: reject]' );
 *
 * @param {String} lang Translation language.
 * @param {String} translationKey Sentence which is going to be translated.
 * @returns {String} Translated sentence.
 */
export function translate( lang, translationKey ) {
	if ( !existTranslationKey( lang, translationKey ) ) {
		return translationKey.replace( / \[context: [^\]]+\]$/, '' ) ;
	}

	return translations[ lang ][ translationKey ];
}

function existTranslationKey( lang, translationKey ) {
	return (
		( lang in translations ) &&
		( translationKey in translations[ lang ] )
	);
}

/**
 * Clears translations for test purpose.
 *
 * @protected
 */
export function _clear() {
	for ( const key in translations ) {
		delete translations[ key ];
	}
}
