"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const settingContext = createContext<{
	settings: Record<string, any>;
	updateSetting: (key: string, value: any) => void;
} | null>({
	settings: {} as Record<string, any>,
	updateSetting: (_k: string, _v: any) => {}
})

const activeTabContext = createContext<{
	activeTab: string;
	updateActiveTab: (tab: string) => void;
}>({
	activeTab: '',
	updateActiveTab: (_: string) => {}
})

interface SettingHook {
	value: Record<string, any>,
	set: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

function useSettings(initialize_value?: Record<string, any>): SettingHook {
	const [initializeSettings, setInitializeSettings] = useState(initialize_value ?? {});
	return {
		value: initializeSettings,
		set: setInitializeSettings
	};
}

export interface SettingAreaProps
	extends React.HTMLAttributes<HTMLDivElement> {
	settingHook: SettingHook
}

const Root = React.forwardRef<HTMLDivElement, SettingAreaProps>((
		{ children, settingHook},
		ref
	) => {
		const [activeTab, setActiveTab] = useState<string>('general')
		const settings = settingHook.value;

		const updateSetting = useCallback((key: string, value: any) => {
			settingHook.set(prev => ({ ...prev, [key]: value }))
		}, [])

		const updateActiveTab = useCallback((tab: string) => {
			setActiveTab(_ => (tab))
		}, [])

		return (
			<settingContext.Provider value={{settings, updateSetting}}>
				<activeTabContext.Provider value={{activeTab, updateActiveTab}}>
					<div
						ref={ref}
						className="flex w-full"
					>
						{React.Children.map(children, child => {
							if (React.isValidElement(child) && child.type === SideBar) {
								const node = child as React.ReactElement<SettingTabsListProps>;
								return React.cloneElement(node, { })
							}
							if (React.isValidElement(child) && child.type === Content) {
								const node = child as React.ReactElement<SettingContentProps>
								return React.cloneElement(node, { })
							}
							return child
						})}
					</div>
				</activeTabContext.Provider>
			</settingContext.Provider>
		)
	}
);
Root.displayName = 'Root'

export interface SettingTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>
{
	value: string;
	activeClassName?: string;
}

const Trigger = React.forwardRef<HTMLButtonElement, SettingTriggerProps>((
	{ className, activeClassName, children, value, onClick },
	ref
) => {
	const {activeTab} = useContext(activeTabContext);
	return (
		<Button
			ref={ref}
			onClick={onClick}
			className={cn(
				"justify-start transition-all duration-200 ease-in-out hover:bg-white/70",
				className,
				(activeTab === value) && cn("bg-[rgba(16,112,112,0.678)]", activeClassName),
			)}
			variant="ghost"
		>
			{children}
		</Button>
	);
});
Trigger.displayName = 'Trigger'

export interface SettingContentProps
	extends React.HTMLAttributes<HTMLDivElement> {
	value: string;
	title?: string;
	asDefault?: boolean
}

const Content = React.forwardRef<HTMLDivElement, SettingContentProps>((
	{ className, children, title, value, asDefault},
	ref
) => {
	const {activeTab, updateActiveTab} = useContext(activeTabContext);
	const isActive = activeTab === value;

	if(asDefault) {
		useEffect(() => {
			updateActiveTab(value);
		}, []);
	}
	if(!isActive) return null;

	return (
		<div ref={ref} className={cn("flex-1 p-6 overflow-auto", className)}>
			<h1 className="text-3xl mb-6">{title??((value.charAt(0).toUpperCase() + value.slice(1))+' Settings')}</h1>
			<div className="space-y-4">
				{children}
			</div>
		</div>
	);
});
Content.displayName = 'Content'

export interface SettingItemProps
	extends React.HTMLAttributes<HTMLDivElement> {
	hint: string;
	name: string;
	type: 'text' | 'number' | 'boolean' | 'select';
	options?: { label: string; value: string }[];
	schema?: z.ZodType;
}

const Item = React.forwardRef<HTMLDivElement, SettingItemProps>((
	{ hint, name, type, options, schema },
	ref
) => {
	// TODO(dev) 添加数据验证逻辑
	const context = useContext(settingContext);
	if (!context) throw new Error('SettingItem must be used within a SettingArea');
	const { settings, updateSetting } = context;

	const value = settings[name];

	const handleChange = (newValue: any) => {
		if (schema) {
			try {
				schema.parse(newValue);
			} catch (error) {
				console.error('Validation error:', error);
				return;
			}
		}
		updateSetting(name, newValue);
	};

	return (
		<div ref={ref} className="flex items-center">
			<Label className="mr-2.5 text-base" htmlFor={name}>{hint}</Label>
			{type === 'text' && (
				<Input
					id={name}
					value={value || ''}
					onChange={(e) => handleChange(e.target.value)}
					className="w-[180px]"
				/>
			)}
			{type === 'number' && (
				<Input
					id={name}
					type="number"
					value={value || ''}
					onChange={(e) => handleChange(Number(e.target.value))}
					className="w-[180px]"
				/>
			)}
			{type === 'boolean' && (
				<div>
					<Switch
						id={name}
						checked={value || false}
						onCheckedChange={handleChange}
					/>
				</div>
			)}
			{type === 'select' && options && (
				<Select value={value} onValueChange={handleChange}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
});
Item.displayName = 'Item'

export interface SettingTabsListProps
	extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const SideBar = React.forwardRef<HTMLDivElement, SettingTabsListProps>((
	{ className, children },
	ref
) => {
	const {updateActiveTab} = useContext(activeTabContext);
	return (
		<div
			ref={ref}
			className={cn(
				"w-48 bg-secondary p-4 flex flex-col gap-2",
				className,
			)}
		>
			{React.Children.map(children, child => {
				if (React.isValidElement(child) && child.type === Trigger) {
					const node = child as React.ReactElement<SettingTriggerProps>;
					return React.cloneElement(node, {
						onClick: () => updateActiveTab(node.props.value),
						className: "transition-all duration-200 ease-in-out hover:shadow-[0_0_5px_2px_rgba(26,216,216,0.795)]",
					});
				}
				return child;
			})}
		</div>
	);
})
SideBar.displayName = 'SideBar'

export interface SettingBackTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const BackTrigger = React.forwardRef<HTMLButtonElement, SettingBackTriggerProps>((
	{ className, children, onClick },
	ref
) => {
	return (
		<Button
			ref={ref}
			onClick={onClick}
			className={cn(
				"justify-start mb-4 transition-all duration-200 ease-in-out",
				className,
			)}
			variant="ghost"
		>
			{children}
		</Button>
	);
});
BackTrigger.displayName = 'BackTrigger'

export interface SettingConfirmTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const ConfirmTrigger = React.forwardRef<HTMLButtonElement, SettingConfirmTriggerProps>((
	{ className, children, onClick },
	ref
) => {
	return (
		<div className="fixed bottom-4 right-4 z-50 px-6 py-3 text-sm font-medium rounded-lg transition-shadow duration-200">
			<Button
				ref={ref}
				onClick={onClick}
				className={cn('bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground', className)}
				variant="ghost"
			>
				{children}
			</Button>
		</div>
	);
});
ConfirmTrigger.displayName = 'ConfirmTrigger'

const SettingPanel= {
	Root,
	Trigger,
	Content,
	Item,
	SideBar,
	BackTrigger,
	ConfirmTrigger,
}

export {
	useSettings,

	SettingPanel,
}
