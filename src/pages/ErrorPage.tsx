'use client'

import { useEffect } from 'react'
import { AlertCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { Link } from "@tanstack/react-router";

export default function ErrorPage({
								  error,
								  reset,
							  }: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error(error)
	}, [error])

	return (
		<div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8 p-10 rounded-xl shadow-lg">
				<div className="flex flex-col items-center">
					<AlertCircle className="h-16 w-16 text-red-500 mb-4" />
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Oops! Something went wrong
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						{error.message || "An unexpected error occurred"}
					</p>
				</div>
				<div className="mt-8 space-y-6">
					<Button
						onClick={reset}
						className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
					>
						Try again
					</Button>
					<Link href="/">
						<Button
							variant="outline"
							className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							<Home className="h-5 w-5 mr-2" />
							Return to homepage
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}

