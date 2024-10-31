import React from "react"
import { InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const InputWithoutBorder = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none invalid:border-pink-500 invalid:text-pink-600 focus:invalid:border-pink-500 focus:invalid:ring-pink-500",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
InputWithoutBorder.displayName = "InputWithoutBorder";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	maxHeight?: number
}

const TextAreaWithoutBorder = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
	({ className, maxHeight = 200, ...props }, ref) => {
		const textareaRef = React.useRef<HTMLTextAreaElement>(null)

		React.useEffect(() => {
			const textarea = ref ? (ref as React.RefObject<HTMLTextAreaElement>).current : textareaRef.current
			if (textarea) {
				const adjustHeight = () => {
					textarea.style.height = 'auto'
					textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
				}

				adjustHeight()
				textarea.addEventListener('input', adjustHeight)
				return () => textarea.removeEventListener('input', adjustHeight)
			}
		}, [maxHeight, ref])

		return (
			<textarea
				className={cn(
					"w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400",
					"focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500",
					"disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:shadow-none",
					"invalid:border-pink-500 invalid:text-pink-600",
					"focus:invalid:border-pink-500 focus:invalid:ring-pink-500",
					"resize-none overflow-auto",
					className
				)}
				ref={ref || textareaRef}
				style={{ maxHeight: `${maxHeight}px` }}
				{...props}
			/>
		)
	}
)

TextAreaWithoutBorder.displayName = "TextAreaWithoutBorder"

export {
	InputWithoutBorder,
}
