import React from "react";
import { Link, Divider } from "@heroui/react";
import { Icon } from "@iconify/react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Testimonials", href: "#testimonials" },
        { name: "FAQ", href: "#faq" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Blog", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "Guides", href: "#" },
        { name: "API Docs", href: "#" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "#" },
        { name: "Partners", href: "#" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Cookie Policy", href: "#" },
        { name: "GDPR", href: "#" }
      ]
    }
  ];
  
  const socialLinks = [
    { icon: "logos:twitter", href: "#" },
    { icon: "logos:facebook", href: "#" },
    { icon: "logos:linkedin-icon", href: "#" },
    { icon: "logos:instagram-icon", href: "#" }
  ];

  return (
    <footer className="bg-content2 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <Icon icon="lucide:zap" className="text-primary text-xl" />
              <span className="font-bold text-lg ml-1">EventPulse</span>
            </div>
            <p className="text-foreground-600 mb-6 max-w-xs">
              Simplify your event management process with our all-in-one platform for contacts, events, and email communications.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <Link key={index} href={social.href} isExternal>
                  <Icon icon={social.icon} className="text-2xl" />
                </Link>
              ))}
            </div>
          </div>
          
          {footerLinks.map((column, index) => (
            <div key={index} className="col-span-1">
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, idx) => (
                  <li key={idx}>
                    <Link href={link.href} color="foreground" className="text-sm text-foreground-600 hover:text-foreground">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <Divider className="my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-foreground-500">
            © {currentYear} EventPulse. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" color="foreground" className="text-sm text-foreground-500">
              Privacy
            </Link>
            <Link href="#" color="foreground" className="text-sm text-foreground-500">
              Terms
            </Link>
            <Link href="#" color="foreground" className="text-sm text-foreground-500">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};