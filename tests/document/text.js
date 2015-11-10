/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* jshint expr: true */

/* bender-tags: document */

'use strict';

var modules = bender.amd.require(
	'document/text',
	'document/attribute'
);

describe( 'Text', function() {
	describe( 'constructor', function() {
		it( 'should create character without attributes', function() {
			var Text = modules[ 'document/text' ];
			var Attribute = modules[ 'document/attribute' ];

			var attrs = [ new Attribute( 'bold', true ) ];
			var text = new Text( 'bar', attrs );

			expect( text ).to.have.property( 'text' ).that.equals( 'bar' );
			expect( text ).to.have.property( 'attrs' ).that.is.an( 'array' );
			expect( text.attrs ).to.be.deep.equals( attrs );
		} );
	} );
} );