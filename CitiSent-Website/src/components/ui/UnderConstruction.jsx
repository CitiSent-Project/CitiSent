import { motion } from 'framer-motion'
import { FiTool } from 'react-icons/fi'

const MotionDiv = motion.div

export function UnderConstruction({ pageName }) {
	return (
		<main className="w-full flex-1 min-w-0 p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[80vh]">
			<MotionDiv
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
				className="text-center flex flex-col items-center justify-center max-w-md"
			>
					<div className="mb-6 rounded-full border border-slate-200 bg-slate-100 p-6">
						<FiTool className="text-4xl text-blue-600" />
				</div>
				<h1 className="text-2xl font-bold text-slate-900 mb-3">
					{pageName} Page Under Construction
				</h1>
				<p className="text-slate-500 mb-8 leading-relaxed">
					We're currently working hard to bring you the {pageName} features. 
					Check back soon to see the updates!
				</p>
			</MotionDiv>
		</main>
	)
}