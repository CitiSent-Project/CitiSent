import { motion } from 'framer-motion'
import { FiTool } from 'react-icons/fi'

export function UnderConstruction({ pageName }) {
	return (
		<main className="mx-auto max-w-350 flex-1 p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[80vh]">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
				className="text-center flex flex-col items-center justify-center max-w-md"
			>
				<div className="bg-cyan-100/50 p-6 rounded-full mb-6">
					<FiTool className="text-4xl text-cyan-600" />
				</div>
				<h1 className="text-2xl font-bold text-slate-900 mb-3">
					{pageName} Page Under Construction
				</h1>
				<p className="text-slate-500 mb-8 leading-relaxed">
					We're currently working hard to bring you the {pageName} features. 
					Check back soon to see the updates!
				</p>
			</motion.div>
		</main>
	)
}