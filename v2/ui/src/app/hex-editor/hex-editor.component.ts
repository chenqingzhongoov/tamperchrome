import { Component, Directive, OnInit, EventEmitter, ElementRef, ViewChildren, QueryList, Input, Output } from '@angular/core';
import { FocusKeyManager, FocusableOption } from '@angular/cdk/a11y';
import { UP_ARROW, DOWN_ARROW } from '@angular/cdk/keycodes';

@Directive({
	selector: '[app-hex-editor-character]'
})
export class HexEditorCharacter implements FocusableOption {
	@Input() index: number;
	constructor(public el: ElementRef<any>) { }
	focus() {
		setTimeout(()=>{
			let element = this.el.nativeElement;
			const input = element.querySelector('input');
			input.focus();
			input.select();
		});
	}
	disabled = false;
}

@Directive({
	selector: '[app-hex-editor-character-shadow]',
})
export class HexEditorCharacterShadow {
	@Input() index: number;
	constructor(public el: ElementRef<any>) { }
}

@Component({
	selector: 'app-hex-editor',
	templateUrl: './hex-editor.component.html',
	styleUrls: ['./hex-editor.component.scss']
})
export class HexEditorComponent {
	@Input() set value(v: string) {
		this.charValues = v.split('');
		this.hexValues = this.charValues.map(c => c ? c.charCodeAt(0).toString(16) : '');
	}
	@Output() valueChange = new EventEmitter<string>();
	@Input() readonly: boolean;

	shadowFocused: boolean = false;
	charValues: string[] = [];
	hexValues: string[] = [];
	keyManager: FocusKeyManager<HexEditorCharacter> = null;
	@ViewChildren(HexEditorCharacter) chars: QueryList<HexEditorCharacter>;
	@ViewChildren(HexEditorCharacterShadow) shadows: QueryList<HexEditorCharacterShadow>;
	ngAfterViewInit() {
		this.keyManager = new FocusKeyManager(this.chars)
			.withHorizontalOrientation('ltr')
			.withVerticalOrientation(false);
		this.keyManager.updateActiveItem(0);
	}

	elementIsSelected(rowIndex: number, i: number) {
		const charIndex = rowIndex * 16 + i;
		if (this.keyManager && this.keyManager.activeItem) {
			return this.keyManager.activeItem.index == charIndex;
		}
		// if the keyManager is not setup yet, show the first.
		return charIndex == 0;
	}

	clickElement(rowIndex: number, i: number) {
		const charIndex = rowIndex * 16 + i;
		const char = this.chars.find(item=>item.index==charIndex);
		this.keyManager.setActiveItem(char);
		this.focusShadowIfNeeded();
	}

	focusShadowIfNeeded() {
		if (!this.shadowFocused) return;
		const shadow = this.shadows.find(
			(item)=>item.index == this.keyManager.activeItem.index);
		setTimeout(()=>{
			const element = shadow.el.nativeElement.querySelector('input');
			element.focus();
			element.select();
		});
	}

	onValueChange() {
		const oldHex = this.hexValues.join();
		this.hexValues = this.charValues.map(c => c ? c.charCodeAt(0).toString(16) : '');
		if (oldHex != this.hexValues.join()) {
			this.keyManager.setNextItemActive();
			this.focusShadowIfNeeded();
		}
		this.valueChange.emit(this.charValues.join(''));
	}

	onHexChange(i: number) {
		let prevValue = this.charValues[i];
		this.charValues = this.hexValues.map(h => h ? String.fromCharCode(parseInt(h, 16)) : '');
		if (this.hexValues[i].length == 2 && prevValue != this.charValues[i]) {
			this.keyManager.setNextItemActive();
		}
		this.valueChange.emit(this.charValues.join(''));
	}

	onKeydown(event: KeyboardEvent) {
		const currentIndex = this.keyManager.activeItemIndex;
		switch (event.keyCode) {
			case UP_ARROW:
				this.keyManager.setActiveItem(Math.max(0, currentIndex - 16));
				event.preventDefault();
				break;
			case DOWN_ARROW:
				this.keyManager.setActiveItem(
					Math.min(this.chars.length - 1, currentIndex + 16));
				event.preventDefault();
				break;
			default:
				this.keyManager.onKeydown(event);
		}
		if (currentIndex != this.keyManager.activeItemIndex) {
			this.focusShadowIfNeeded();
		}
	}

	trackByFn(index, char) {
		return index;
	}

	getRowIndex() {
		return Array.from(Array(Math.ceil(this.charValues.length / 16)).keys());
	}

	constructor() {}

}
