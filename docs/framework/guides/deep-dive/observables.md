---
category: framework-deep-dive
---

# Observables

{@link module:utils/observablemixin~Observable Observables} are objects which have properties that can be observed. That means when the value of such property changes, an event is fired by the observable and the change can be reflected in other pieces of the code that listen to that event.

Observables are common building blocks of the {@link framework/index CKEditor 5 Framework}. They are particularly popular in the UI, the {@link module:ui/view~View `View`} class and its subclasses  benefiting from the observable interface the most: it is the {@link framework/guides/architecture/ui-library#interaction templates bound to the observables} what makes the user interface dynamic and interactive. Some of the basic classes like {@link module:core/editor/editor~Editor `Editor`} or {@link module:core/command~Command `Command`} are observables too.

Any class can become observable; all you need to do is mix the {@link module:utils/observablemixin~ObservableMixin} into it:

```js
import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

export default class AnyClass {
	// ...
}

mix( AnyClass, ObservableMixin );
```

Observables are useful when it comes to managing the state of the application, which can be dynamic and, more often than not, centralized and shared between components of the application. One observable can also propagate its state (or its part) to another using [property bindings](#property-bindings).

Observables can also [decorate their methods](#decorating-object-methods) which makes it possible to control their execution using event listeners, giving external code some control over their behavior.

## Making properties observable

Having mixed the {@link module:utils/observablemixin~ObservableMixin} into your class, you can define observable properties. To do that, use the {@link module:utils/observablemixin~ObservableMixin#set `set()` method}. Let's set a couple of properties and see what they look like in a simple `Command` class:

```js
export default class Command {
	constructor( name ) {
		// This property is not observable.
		// Not all properties must be observable, it's up to you!
		this.name = name;

		// this.value is observable but undefined.
		this.set( 'value' );

		// this.isEnabled is observable and false.
		this.set( 'isEnabled', false );
	}
}

mix( Command, ObservableMixin );
```

<info-box info>
	The `set()` method can accept an object of key/value pairs to shorten the code. Knowing that, making properties observable can be as simple as:

	```js
	this.set( {
		value: undefined,
		isEnabled: false
	} );
	```
</info-box>

Finally, let's create a new command and see how it communicates with the world.

Each time the `value` property changes, the command fires the `change:value` event containing information about its state in the past and the new value. The corresponding `change:isEnabled` will be fired when the `isEnabled` property changes too.

```js
const command = new Command( 'bold' );

command.on( 'change:value', ( evt, propertyName, newValue, oldValue ) => {
    console.log(
        `${ propertyName } has changed from ${ oldValue } to ${ newValue }`
    );
} )

command.value = true; // -> 'value has changed from undefined to true'
command.value = false; // -> 'value has changed from true to false'

command.name = 'italic'; // -> changing a regular property fires no event
```

During its life cycle, an instance of the `Command` can be enabled and disabled many times just as its `value` can change very often and different parts of the application will certainly be interested in that state.

For instance, some commands can be represented by a button, which should be able to figure out its look ("pushed", disabled, etc.) as soon as possible. Using observable properties makes it a lot easier because all the button must know about its command is the names of properties to listen to apply changes instantly.

Additionally, as the number of observable properties increases, you can save yourself the hassle of creating and maintaining multiple `command.on( 'change:property', () => { ... } )` listeners by sharing command's state with the button using [bound properties](#property-bindings), which are the key topic of the next chapter.

## Property bindings

One observable can also propagate its state (or part of it) to another observable to simplify the code and avoid numerous `change:property` event listeners. First, make sure both objects (classes) mix the {@link module:utils/observablemixin~ObservableMixin}, then use the {@link module:utils/observablemixin~ObservableMixin#bind `bind()`} method to create the binding.

### Simple bindings

Let's consider two objects: a `command` and a corresponding `button` (both {@link module:utils/observablemixin~Observable}).

```js
const command = new Command( 'bold' );
const button = new Button();
```

Any "decent" button must update its look when the command becomes disabled. A simple property binding doing that could look as follows:

```js
button.bind( 'isEnabled' ).to( command );
```

After that:

* `button.isEnabled` **instantly equals** `command.isEnabled`,
* whenever `command.isEnabled` changes, `button.isEnabled` will immediately reflect its value.

Note that `command.isEnabled` **must** be defined using the `set()` method for the binding to be dynamic &mdash; we did that in the [previous chapter](#making-properties-observable). The `button.isEnabled` property does not need to exist prior to the `bind()` call and in such case, it will be created on demand. If the `button.isEnabled` property is already observable, don't worry: binding it to the command will do no harm.

By creating the binding, we allowed the button to simply use its own `isEnabled` property, e.g. in the dynamic template (check out {@link framework/guides/architecture/ui-library#template this guide} to learn how).

#### Renaming properties

Now let's dive into the `bind( ... ).to( ... )` syntax for a minute. The last example corresponds to the following code:

```js
button.bind( 'isEnabled' ).to( command, 'isEnabled' );
```

You probably noticed the `to( ... )` interface which helps specify the name of the property ("rename" the property in the binding).

What if instead of `isEnabled`, the `Command` class implemented the `isWorking` property, which does not quite fit into the button object? Let's bind two properties that have different names then:

```js
button.bind( 'isEnabled' ).to( command, 'isWorking' );
```

From now on, whenever `command.isWorking` changes, the value of `button.isEnabled` will reflect it.

### Binding multiple properties

It is also possible to bind more that one property at a time to simplify the code:

```js
button.bind( 'isEnabled', 'value' ).to( command );
```

which is the same as

```js
button.bind( 'isEnabled' ).to( command );
button.bind( 'value' ).to( command );
```

In the above binding, the value of `button.isEnabled` will reflect `command.isEnabled` and the value of `button.value` will reflect `command.value`.

Renaming is still possible when binding multiple properties. Consider the following example which binds `button.isEnabled` to `command.isWorking` and `button.currentState` to `command.value`:

```js
button.bind( 'isEnabled', 'currentState' ).to( command, 'isWorking', 'value' );
```

### Binding with multiple observables

The binding can include more than one observable, combining multiple properties in a custom callback function. Let's create a button that gets enabled only when the `command` is enabled and the `ui` (also an `Observable`) is visible:

```js
button.bind( 'isEnabled' ).to( command, 'isEnabled', ui, 'isVisible',
	( isCommandEnabled, isUIVisible ) => isCommandEnabled && isUIVisible );
```

From now on, the value of `button.isEnabled` depends both on `command.isEnabled` and `ui.isVisible`
as specified by the function: both must be `true` for the button to become enabled.

### Binding with an array of observables

It is possible to bind to the same property in an array of observables. Let's bind a `button` to multiple commands so that each and every one must be enabled for the button
to become enabled:

```js
const commands =  [ commandA, commandB, commandC ];

button.bind( 'isEnabled' ).toMany( commands, 'isEnabled', ( isAEnabled, isBEnabled, isCEnabled ) => {
	return isAEnabled && isBEnabled && isCEnabled;
} );
```

The binding can be simplified using the spread operator (`...`) and the `Array.every()` method:

```js
const commands =  [ commandA, commandB, commandC ];

button.bind( 'isEnabled' ).toMany( commands, 'isEnabled', ( ...areEnabled ) => {
	return areEnabled.every( isCommandEnabled => isCommandEnabled );
} );
```

### Releasing the bindings

If you don't want your object's properties to be bound any longer, you can use the {@link module:utils/observablemixin~ObservableMixin#unbind `unbind()`} method.

You can specify the names of the properties to selectively unbind them

```js
button.bind( 'isEnabled', 'value' ).to( command );

// ...

// From now on, button.isEnabled is no longer bound to the command.
button.unbind( 'isEnabled' );
```

or you can dismiss all bindings by calling the method without arguments

```js
button.bind( 'isEnabled', 'value' ).to( command );

// ...

// Both "isEnabled" and "value" properties are independent back again.
// They will retain the values determined by the bindings, though.
button.unbind();
```

## Decorating object methods

Decorating object methods transforms them into event–driven ones without changing their original behavior.

When a method is decorated, an event of the same name is created and fired each time the method is executed. By listening to the event it is possible to cancel the execution, change the arguments or the value returned by the method. This offers an additional flexibility, e.g. giving a third–party code some way to interact with core classes that decorate their methods.

Decorating is possible using the {@link module:utils/observablemixin~ObservableMixin#decorate `decorate()`} method. Having [mixed](#observables) the {@link module:utils/observablemixin~ObservableMixin}, we are going to use the `Command` class from previous sections of this guide to show the potential use–cases:

```js
import ObservableMixin from '@ckeditor/ckeditor5-utils/src/observablemixin';
import mix from '@ckeditor/ckeditor5-utils/src/mix';

class Command {
	constructor() {
		this.decorate( 'execute' );
	}

	// Because the method is decorated, it always fires the #execute event.
	execute( value ) {
		console.log( `Executed the command with value="${ value }"` );
	}
}

mix( Command, ObservableMixin );
```

### Cancelling the execution

Because the `execute()` method is event–driven, it can be controlled externally. E.g. the execution could be stopped for certain arguments. Note the `high` listener {@link module:utils/priorities~PriorityString priority} used to intercept the default action:

```js
const command = new Command();

// ...

// Some code interested in controlling this particular command.
command.on( 'execute', ( evt, args ) => {
	if ( args[ 0 ] !== 'bold' ) {
		evt.stop();
	}
}, { priority: 'high' } );

command.execute( 'bold' ); // -> 'Executed the command with value="bold"'
command.execute( 'italic' ); // Nothing is logged, the execution has been stopped.
```

### Changing the returned value

It is possible to control the returned value of a decorated method using an event listener. The returned value is passed in the event data as a `return` property:

```js
const command = new Command();

// ...

// Some code interested in controlling this particular command.
command.on( 'execute', ( evt ) => {
	if ( args[ 0 ] == 'bold' ) {
		evt.return = true;
	} else {
		evt.return = false;
	}
} );

console.log( command.execute( 'bold' ) ); // -> true
console.log( command.execute( 'italic' ) ); // -> false
console.log( command.execute() ); // -> false
```

### Changing arguments on the fly

Just like the returned value, the arguments passed to the method can be changed in the event listener. Note the `high` listener {@link module:utils/priorities~PriorityString priority} of the used to intercept the default action:


```js
const command = new Command();

// ...

// Some code interested in controlling this particular command.
command.on( 'execute', ( evt, args ) => {
	if ( args[ 0 ] === 'bold' ) {
		args[ 0 ] = 'underline';
	}
}, { priority: 'high' } );

command.execute( 'bold' ); // -> 'Executed the command with value="underline"'
command.execute( 'italic' ); // -> 'Executed the command with value="italic"'
```
