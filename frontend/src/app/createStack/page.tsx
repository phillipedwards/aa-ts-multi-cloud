import Image from 'next/image'

export default function CreateStack() {
    return (
        <div className="flex-col justify-between p-24">
            <h1 className="text-3xl font-bold underline">Create Stack</h1>
            <br />
            <form className="w-full max-w-sm">
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="inline-stack-name">
                            Stack Name
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="inline-stack-name" type="text" value="dev" />
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="inline-cloud">
                            Cloud
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="inline-cloud" type="text" placeholder="aws" />
                    </div>
                </div>
                <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3">
                        <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="inline-site-content">
                            Site Content
                        </label>
                    </div>
                    <div className="md:w-2/3">
                        <input className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="inline-site-content" type="text" placeholder="<h1>hi!</hi>" />
                    </div>
                </div>
                {/* <div className="md:flex md:items-center mb-6">
                    <div className="md:w-1/3"></div>
                    <label className="md:w-2/3 block text-gray-500 font-bold">
                        <input className="mr-2 leading-tight" type="checkbox" />
                        <span className="text-sm">
                            Send me your newsletter!
                        </span>
                    </label>
                </div> */}
            </form>
            <div className="md:flex md:items-center mb-6">
                <div className="md:w-1/4">
                    <a
                        href="/createStack"
                    >
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            create
                        </button>
                    </a>
                </div>
                <div className="md:w-1/4">
                    <a
                        href="/stacks"
                    >
                        <button className="bg-white-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            cancel
                        </button>
                    </a>
                </div>
                <div className="md:w-3/4"></div>
            </div>
        </div>
    );
}